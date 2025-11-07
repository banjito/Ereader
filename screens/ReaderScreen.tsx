import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JSZip from 'jszip';

interface ReaderScreenProps {
  route: {
    params: {
      book: {
        title: string;
        uri: string;
        mimeType?: string;
      };
    };
  };
  navigation: any;
}

const { width, height } = Dimensions.get('window');

export default function ReaderScreen({ route, navigation }: ReaderScreenProps) {
  const { book } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [showControls, setShowControls] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [initialPage, setInitialPage] = useState(1);

  const isPDF = book.mimeType === 'application/pdf' || book.uri.endsWith('.pdf');
  const isEPUB = book.mimeType === 'application/epub+zip' || book.uri.endsWith('.epub');
  const isTXT = book.mimeType === 'text/plain' || book.uri.endsWith('.txt');
  const isCBZ = book.mimeType === 'application/x-cbz' || book.uri.endsWith('.cbz');
  const isCBR = book.mimeType === 'application/x-cbr' || book.uri.endsWith('.cbr');
  const isZIP = book.mimeType === 'application/zip' || book.uri.endsWith('.zip');
  const isImage = book.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(book.uri);

  useEffect(() => {
    if (book.uri) {
      (async () => {
        const initialPageValue = await loadProgress();
        setInitialPage(initialPageValue);
        if (isPDF) {
          loadPDF();
        } else if (isTXT) {
          loadTXT();
        } else if (isEPUB) {
          loadEPUB();
        } else if (isCBZ || isZIP) {
          loadComicArchive(initialPageValue);
        } else if (isImage) {
          loadSingleImage(initialPageValue);
        } else {
          setLoading(false);
        }
      })();
    }
  }, [book.uri]);

  // Save progress whenever page changes
  useEffect(() => {
    if (currentPage > 0 && totalPages > 0) {
      saveProgress();
    }
  }, [currentPage, totalPages]);

  const loadProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(`progress_${book.uri}`);
      if (saved) {
        const { page } = JSON.parse(saved);
        setCurrentPage(page);
        return page;
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
    return 1;
  };

  const saveProgress = async () => {
    try {
      const progress = {
        page: currentPage,
        total: totalPages,
        percentage: Math.round((currentPage / totalPages) * 100),
      };
      await AsyncStorage.setItem(`progress_${book.uri}`, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadPDF = async () => {
    try {
      setLoading(true);
      
      // Check if it's a sample book and load demo content as text
      if (book.uri.startsWith('sample')) {
        const sampleContent = generateSampleContent(book.title);
        setPdfData(sampleContent);
        setLoading(false);
        return;
      }
      
      const base64 = await FileSystem.readAsStringAsync(book.uri, {
        encoding: 'base64',
      });
      setPdfData(base64);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      Alert.alert('Error Loading PDF', error?.message || 'Could not read PDF file');
      setLoading(false);
      setPdfData('');
    }
  };

  const loadTXT = async () => {
    try {
      setLoading(true);
      // Check if it's a sample book and load demo content
      if (book.uri.startsWith('sample')) {
        const sampleContent = generateSampleContent(book.title);
        setPdfData(sampleContent);
        setLoading(false);
        return;
      }
      
      const content = await FileSystem.readAsStringAsync(book.uri, {
        encoding: 'utf8',
      });
      setPdfData(content);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading TXT:', error);
      Alert.alert('Error Loading Text', error?.message || 'Could not read text file');
      setLoading(false);
      setPdfData('');
    }
  };

  const generateSampleContent = (title: string): string => {
    const samples: { [key: string]: string } = {
      'The Art of War': `Chapter One: Laying Plans\n\nSun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.\n\nThe art of war, then, is governed by five constant factors, to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field.\n\nThese are: The Moral Law; Heaven; Earth; The Commander; Method and discipline.\n\nThe Moral Law causes the people to be in complete accord with their ruler, so that they will follow him regardless of their lives, undismayed by any danger.\n\nHeaven signifies night and day, cold and heat, times and seasons.\n\nEarth comprises distances, great and small; danger and security; open ground and narrow passes; the chances of life and death.\n\nThe Commander stands for the virtues of wisdom, sincerity, benevolence, courage and strictness.\n\nBy method and discipline are to be understood the marshaling of the army in its proper subdivisions, the graduations of rank among the officers, the maintenance of roads by which supplies may reach the army, and the control of military expenditure.`,
      
      'Pride and Prejudice': `Chapter 1\n\nIt is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.\n\nHowever little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.\n\n"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"\n\nMr. Bennet replied that he had not.\n\n"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."\n\nMr. Bennet made no answer.\n\n"Do you not want to know who has taken it?" cried his wife impatiently.\n\n"You want to tell me, and I have no objection to hearing it."\n\nThis was invitation enough.\n\n"Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it, that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week."`,
      
      'Meditations': `Book One\n\nFrom my grandfather Verus I learned good morals and the government of my temper.\n\nFrom the reputation and remembrance of my father, modesty and a manly character.\n\nFrom my mother, piety and beneficence, and abstinence, not only from evil deeds, but even from evil thoughts; and further, simplicity in my way of living, far removed from the habits of the rich.\n\nFrom my great-grandfather, not to have frequented public schools, and to have had good teachers at home, and to know that on such things a man should spend liberally.\n\nFrom my governor, to be neither of the green nor of the blue party at the games in the Circus, nor a partizan either of the Parmularius or the Scutarius at the gladiators' fights; from him too I learned endurance of labour, and to want little, and to work with my own hands, and not to meddle with other people's affairs, and not to be ready to listen to slander.\n\nThe universe is change; our life is what our thoughts make it.`,
      
      '1984': `Part One: Chapter 1\n\nIt was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.\n\nThe hallway smelt of boiled cabbage and old rag mats. At one end of it a coloured poster, too large for indoor display, had been tacked to the wall. It depicted simply an enormous face, more than a metre wide: the face of a man of about forty-five, with a heavy black moustache and ruggedly handsome features.\n\nWinston made for the stairs. It was no use trying the lift. Even at the best of times it was seldom working, and at present the electric current was cut off during daylight hours. It was part of the economy drive in preparation for Hate Week. The flat was seven flights up, and Winston, who was thirty-nine and had a varicose ulcer above his right ankle, went slowly, resting several times on the way.`,
      
      'The Great Gatsby': `Chapter 1\n\nIn my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had."\n\nHe didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.\n\nThe abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men. Most of the confidences were unsought—frequently I have feigned sleep, preoccupation, or a hostile levity when I realized by some unmistakable sign that an intimate revelation was quivering on the horizon.`
    };
    
    return samples[title] || `This is sample content for ${title}.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`;
  };

  const loadEPUB = async () => {
    try {
      setLoading(true);
      
      // Check if it's a sample book and load demo content
      if (book.uri.startsWith('sample')) {
        const sampleContent = generateSampleContent(book.title);
        setPdfData(sampleContent);
        setLoading(false);
        return;
      }
      
      const base64 = await FileSystem.readAsStringAsync(book.uri, {
        encoding: 'base64',
      });
      
      const zip = await JSZip.loadAsync(base64, { base64: true });
      let textContent = '';

      // Find content files - look in common EPUB directories
      const contentFiles: string[] = [];
      const files = Object.keys(zip.files).sort();
      const debugFiles = [...files]; // for debug
      
      for (const filename of files) {
        // Only process actual content files, skip metadata, images, stylesheets, etc.
        if (
          /\.(xhtml|html|htm|xml)$/i.test(filename) &&
          !filename.startsWith('__MACOSX') &&
          !filename.startsWith('META-INF') &&
          !filename.includes('nav.xhtml') &&
          !filename.includes('toc.') &&
          !filename.includes('cover') &&
          !filename.includes('titlepage') &&
          !filename.endsWith('nav.html')
        ) {
          contentFiles.push(filename);
        }
      }
      
      // Extract text from each content file
      for (const filename of contentFiles) {
        const file = zip.files[filename];
        if (!file.dir) {
          try {
            const content = await file.async('string');
            
            // Better HTML parsing that preserves structure
            let textOnly = content
              // Remove style and script tags
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              // Convert block elements to paragraphs
              .replace(/<\/p>/gi, '</p>\n\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/div>/gi, '</div>\n')
              .replace(/<\/h[1-6]>/gi, '</h>\n\n')
              // Remove all remaining HTML tags
              .replace(/<[^>]+>/g, '')
              // Decode HTML entities
              .replace(/&nbsp;/g, ' ')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              // Clean up whitespace
              .replace(/[ \t]+/g, ' ')
              .replace(/\n\n\n+/g, '\n\n')
              .trim();
            
            // Filter out files that are mostly metadata or have very little actual content
            const wordCount = textOnly.split(/\s+/).length;
            if (wordCount > 50 && !textOnly.match(/^(jfif|exif|adobe|photoshop)/i)) {
              textContent += textOnly + '\n\n';
            }
          } catch (err) {
            console.log('Error reading file:', filename, err);
          }
        }
      }
      
      if (textContent.length < 100) {
        throw new Error('No readable text content found in EPUB. This file may be image-based or corrupted.');
      }
      
      setPdfData(textContent);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading EPUB:', error);
      const debugInfo = `Error loading EPUB: ${error?.message || 'Unknown error'}

Files in archive: ${debugFiles.length}
Content files found: ${contentFiles.length}
Text content length: ${textContent.length}

All files:
${debugFiles.join('\n')}

Content files:
${contentFiles.join('\n')}

Sample text content:
${textContent.substring(0, 500)}`;
      setPdfData(debugInfo);
      setLoading(false);
      Alert.alert('Error Loading EPUB', error?.message || 'Could not read EPUB file');
    }
  };

  const loadComicArchive = async (initialPage: number = 1) => {
    try {
      setLoading(true);
      const base64 = await FileSystem.readAsStringAsync(book.uri, {
        encoding: 'base64',
      });

      const zip = await JSZip.loadAsync(base64, { base64: true });
      const imageFiles: string[] = [];

      // Get all image files from the archive
      const files = Object.keys(zip.files).sort();
      for (const filename of files) {
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(filename) && !filename.startsWith('__MACOSX')) {
          const file = zip.files[filename];
          if (!file.dir) {
            const imageData = await file.async('base64');
            const ext = filename.split('.').pop()?.toLowerCase();
            const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
            imageFiles.push(`data:${mimeType};base64,${imageData}`);
          }
        }
      }

      setImages(imageFiles);
      setTotalPages(imageFiles.length);
      setCurrentPage(initialPage);
      setImageIndex(initialPage - 1);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading comic archive:', error);
      Alert.alert('Error Loading Archive', error?.message || 'Could not read archive file');
      setLoading(false);
    }
  };

  const loadSingleImage = async (initialPage: number = 1) => {
    try {
      setLoading(true);
      const base64 = await FileSystem.readAsStringAsync(book.uri, {
        encoding: 'base64',
      });
      const ext = book.uri.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
      setImages([`data:${mimeType};base64,${base64}`]);
      setTotalPages(1);
      setCurrentPage(1);
      setImageIndex(0);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading image:', error);
      Alert.alert('Error Loading Image', error?.message || 'Could not read image file');
      setLoading(false);
    }
  };

  const handleLeftTap = () => {
    // Go to previous page
    if ((isPDF && !book.uri.startsWith('sample')) || isTXT || isEPUB || book.uri.startsWith('sample')) {
      webViewRef.current?.injectJavaScript(`
        if (window.pdfCurrentPage > 1) {
          window.pdfCurrentPage--;
          window.renderPage(window.pdfCurrentPage);
        }
        true;
      `);
    } else if (isCBZ || isZIP || isImage) {
      // For image-based content, go to previous image
      if (imageIndex > 0) {
        const newIndex = imageIndex - 1;
        setImageIndex(newIndex);
        setCurrentPage(newIndex + 1);
      }
    }
  };

  const handleRightTap = () => {
    // Go to next page
    if ((isPDF && !book.uri.startsWith('sample')) || isTXT || isEPUB || book.uri.startsWith('sample')) {
      webViewRef.current?.injectJavaScript(`
        if (window.pdfCurrentPage < window.pdfTotalPages) {
          window.pdfCurrentPage++;
          window.renderPage(window.pdfCurrentPage);
        }
        true;
      `);
    } else if (isCBZ || isZIP || isImage) {
      // For image-based content, go to next image
      if (imageIndex < images.length - 1) {
        const newIndex = imageIndex + 1;
        setImageIndex(newIndex);
        setCurrentPage(newIndex + 1);
      }
    }
  };

  const handleCenterTap = () => {
    setShowControls(!showControls);
  };

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 32);
    setFontSize(newSize);
    webViewRef.current?.injectJavaScript(`
      document.body.style.fontSize = '${newSize}px';
      true;
    `);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    webViewRef.current?.injectJavaScript(`
      document.body.style.fontSize = '${newSize}px';
      true;
    `);
  };

  // HTML content for displaying text-based files with pagination
  const getTextReaderHTML = (content: string = '', initialPage: number = 1) => {
    // Format content into paragraphs and detect chapter titles
    const paragraphs = content
      .split(/\n\n+/)
      .filter(p => p.trim().length > 0)
      .map(p => {
        const trimmed = p.trim();
        // Detect chapter titles: short text, all caps, or starts with "Chapter"/"Part"/numbers
        const isChapterTitle = 
          trimmed.length < 100 && (
            /^(chapter|part|book|section|prologue|epilogue)\s+\d+/i.test(trimmed) ||
            /^\d+\.?\s+[A-Z]/.test(trimmed) ||
            (trimmed === trimmed.toUpperCase() && trimmed.length > 3)
          );
        
        return {
          text: trimmed,
          isChapter: isChapterTitle
        };
      });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              overflow: hidden;
              background-color: #000000;
              color: #FFFFFF;
            }
            #container {
              width: 100%;
              height: 100%;
              overflow-x: scroll;
              overflow-y: hidden;
              -webkit-overflow-scrolling: touch;
              scroll-snap-type: x mandatory;
              scroll-behavior: auto;
            }
            #container::-webkit-scrollbar {
              display: none;
            }
            #content {
              display: flex;
              height: 100%;
            }
            .page {
              min-width: 100vw;
              width: 100vw;
              height: 100%;
              padding: 40px 30px;
              scroll-snap-align: start;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
            .page::-webkit-scrollbar {
              display: none;
            }
            p {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: ${fontSize}px;
              line-height: 1.6;
              margin-bottom: 1em;
              text-align: justify;
              color: #FFFFFF;
            }
            h2 {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              font-size: ${fontSize + 8}px;
              line-height: 1.3;
              margin: 1.5em 0 1em 0;
              text-align: center;
              color: #FFFFFF;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div id="container">
            <div id="content"></div>
          </div>
          <script>
            const container = document.getElementById('container');
            const content = document.getElementById('content');
            
            // Split content into pages that fit the screen
            const paragraphs = ${JSON.stringify(paragraphs)};
            const pageHeight = window.innerHeight - 80; // Account for padding
            
            let currentPage = document.createElement('div');
            currentPage.className = 'page';
            let currentHeight = 0;
            const pages = [];
            
            // Measure and distribute content across pages
            const tempDiv = document.createElement('div');
            tempDiv.style.width = 'calc(100vw - 60px)';
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.fontSize = '${fontSize}px';
            tempDiv.style.lineHeight = '1.6';
            document.body.appendChild(tempDiv);
            
            paragraphs.forEach((para, index) => {
              const element = para.isChapter 
                ? document.createElement('h2')
                : document.createElement('p');
              element.textContent = para.text;
              tempDiv.innerHTML = '';
              tempDiv.appendChild(element);
              
              const elementHeight = element.offsetHeight + (para.isChapter ? 48 : 16); // More margin for chapters
              
              // Start new page for chapter titles if not at page start
              if (para.isChapter && currentPage.children.length > 0) {
                pages.push(currentPage);
                currentPage = document.createElement('div');
                currentPage.className = 'page';
                currentHeight = 0;
              } else if (currentHeight + elementHeight > pageHeight && currentPage.children.length > 0) {
                pages.push(currentPage);
                currentPage = document.createElement('div');
                currentPage.className = 'page';
                currentHeight = 0;
              }
              
              const elementClone = element.cloneNode(true);
              currentPage.appendChild(elementClone);
              currentHeight += elementHeight;
            });
            
            if (currentPage.children.length > 0) {
              pages.push(currentPage);
            }
            
            document.body.removeChild(tempDiv);
            
            // Add pages to content
            pages.forEach(page => content.appendChild(page));
            
            window.pdfCurrentPage = 1;
            window.pdfTotalPages = pages.length;
            
            // Notify React Native of total pages
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'loaded',
                totalPages: pages.length
              }));
            }
            
            // Handle page rendering
            window.renderPage = function(pageNum) {
              const pageWidth = window.innerWidth;
              container.scrollLeft = (pageNum - 1) * pageWidth;
              
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'pageChanged',
                  currentPage: pageNum,
                  totalPages: pages.length
                }));
              }
            };
            
            // Initial render
            window.renderPage(${initialPage});
          </script>
        </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header - only show when controls are visible */}
      {showControls && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {book.title}
            </Text>
            {totalPages > 0 && (
              <Text style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </Text>
            )}
          </View>
          <View style={styles.headerRight} />
        </View>
      )}

      {/* Font Size Controls */}
      {showControls && (
        <View style={styles.controlsBar}>
          <TouchableOpacity onPress={decreaseFontSize} style={styles.fontButton}>
            <Text style={styles.fontButtonText}>A-</Text>
          </TouchableOpacity>
          <Text style={styles.fontSizeText}>{fontSize}px</Text>
          <TouchableOpacity onPress={increaseFontSize} style={styles.fontButton}>
            <Text style={styles.fontButtonText}>A+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reader with tap zones */}
      <View style={styles.readerContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading book...</Text>
          </View>
        ) : (isPDF && !book.uri.startsWith('sample')) ? (
          pdfData ? (
          <>
            <WebView
              ref={webViewRef}
              source={{ 
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
                      <style>
                        * { 
                          margin: 0; 
                          padding: 0; 
                          box-sizing: border-box; 
                        }
                        html, body { 
                          width: 100vw; 
                          height: 100vh; 
                          overflow: hidden; 
                          background: #000; 
                        }
                        #canvas-container {
                          width: 100%;
                          height: 100%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          background: #000;
                        }
                        canvas {
                          max-width: 100%;
                          max-height: 100%;
                          background: #000;
                        }
                        .loading {
                          color: white;
                          text-align: center;
                          padding: 20px;
                        }
                      </style>
                    </head>
                    <body>
                      <div id="canvas-container">
                        <canvas id="pdf-canvas"></canvas>
                      </div>
                      <script>
                        let pdfDoc = null;
                        window.pdfCurrentPage = 1;
                        window.pdfTotalPages = 0;
                        const canvas = document.getElementById('pdf-canvas');
                        const ctx = canvas.getContext('2d');
                        
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        
                        window.renderPage = function(pageNum) {
                          pdfDoc.getPage(pageNum).then(function(page) {
                            const viewport = page.getViewport({ scale: 1 });
                            const scale = Math.min(
                              window.innerWidth / viewport.width,
                              window.innerHeight / viewport.height
                            );
                            const scaledViewport = page.getViewport({ scale: scale });
                            
                            canvas.width = scaledViewport.width;
                            canvas.height = scaledViewport.height;
                            
                            const renderContext = {
                              canvasContext: ctx,
                              viewport: scaledViewport
                            };
                            
                            page.render(renderContext).promise.then(function() {
                              window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'pageChanged',
                                currentPage: pageNum,
                                totalPages: window.pdfTotalPages
                              }));
                            });
                          });
                        };
                        
                        // Load PDF from base64
                        const pdfData = atob('${pdfData}');
                        const pdfArray = new Uint8Array(pdfData.length);
                        for (let i = 0; i < pdfData.length; i++) {
                          pdfArray[i] = pdfData.charCodeAt(i);
                        }
                        
                        pdfjsLib.getDocument({ data: pdfArray }).promise.then(function(pdf) {
                          pdfDoc = pdf;
                          window.pdfTotalPages = pdf.numPages;
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'loaded',
                            totalPages: pdf.numPages
                          }));
                          window.renderPage(${initialPage});
                        }).catch(function(error) {
                          console.error('Error loading PDF:', error);
                          document.body.innerHTML = '<div class="loading">Error loading PDF: ' + error.message + '</div>';
                        });
                      </script>
                    </body>
                  </html>
                `
              }}
              style={styles.webview}
              startInLoadingState={true}
              bounces={false}
              scrollEnabled={false}
              originWhitelist={['*']}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'loaded') {
                    setTotalPages(data.totalPages);
                  } else if (data.type === 'pageChanged') {
                    setCurrentPage(data.currentPage);
                    setTotalPages(data.totalPages);
                  }
                } catch (e) {
                  console.error('Error parsing message:', e);
                }
              }}
            />
            {/* Tap zones overlay */}
            <View style={styles.tapZonesContainer}>
              <Pressable style={styles.leftTapZone} onPress={handleLeftTap} />
              <Pressable style={styles.centerTapZone} onPress={handleCenterTap} />
              <Pressable style={styles.rightTapZone} onPress={handleRightTap} />
            </View>
          </>
          ) : (
            <View style={styles.unsupportedContainer}>
              <Text style={styles.unsupportedText}>
                Error Loading PDF
              </Text>
              <Text style={styles.unsupportedSubtext}>
                Could not read the PDF file
              </Text>
            </View>
          )
        ) : (isTXT || isEPUB || book.uri.startsWith('sample')) ? (
          pdfData ? (
            <>
              <WebView
                ref={webViewRef}
                source={{ html: getTextReaderHTML(pdfData, initialPage) }}
                style={styles.webview}
                startInLoadingState={true}
                bounces={false}
                scrollEnabled={false}
                originWhitelist={['*']}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === 'loaded') {
                      setTotalPages(data.totalPages);
                      setCurrentPage(1);
                    } else if (data.type === 'pageChanged') {
                      setCurrentPage(data.currentPage);
                      setTotalPages(data.totalPages);
                    }
                  } catch (e) {
                    console.error('Error parsing message:', e);
                  }
                }}
              />
              {/* Tap zones overlay */}
              <View style={styles.tapZonesContainer}>
                <Pressable style={styles.leftTapZone} onPress={handleLeftTap} />
                <Pressable style={styles.centerTapZone} onPress={handleCenterTap} />
                <Pressable style={styles.rightTapZone} onPress={handleRightTap} />
              </View>
            </>
          ) : (
            <View style={styles.unsupportedContainer}>
              <Text style={styles.unsupportedText}>
                Error Loading File
              </Text>
              <Text style={styles.unsupportedSubtext}>
                Could not read the file
              </Text>
            </View>
          )
        ) : (isCBZ || isZIP || isImage) && images.length > 0 ? (
          <>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: images[imageIndex] }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            {/* Tap zones overlay */}
            <View style={styles.tapZonesContainer}>
              <Pressable style={styles.leftTapZone} onPress={handleLeftTap} />
              <Pressable style={styles.centerTapZone} onPress={handleCenterTap} />
              <Pressable style={styles.rightTapZone} onPress={handleRightTap} />
            </View>
          </>
        ) : isCBR ? (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              CBR Format Not Supported
            </Text>
            <Text style={styles.unsupportedSubtext}>
              Please convert CBR files to CBZ format
            </Text>
          </View>
        ) : (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              Unsupported file format
            </Text>
            <Text style={styles.unsupportedSubtext}>
              Supports: PDF, TXT, CBZ, ZIP, and image files
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#808080',
    backgroundColor: '#000000',
  },
  backButton: {
    padding: 8,
    width: 60,
  },
  backButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pageInfo: {
    fontSize: 12,
    color: '#808080',
    marginTop: 4,
  },
  headerRight: {
    width: 60,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#808080',
    backgroundColor: '#000000',
    gap: 24,
  },
  fontButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 6,
  },
  fontButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fontSizeText: {
    fontSize: 14,
    color: '#808080',
    minWidth: 50,
    textAlign: 'center',
  },
  readerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tapZonesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  leftTapZone: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerTapZone: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  rightTapZone: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  unsupportedText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  unsupportedSubtext: {
    fontSize: 14,
    color: '#808080',
    textAlign: 'center',
  },
});

