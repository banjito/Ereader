import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

interface Book {
  id: string;
  title: string;
  author: string;
  progress?: number;
  uri?: string;
  mimeType?: string;
}

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [pendingBook, setPendingBook] = useState<{
    fileName: string;
    uri: string;
    mimeType: string;
  } | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  // Reload books when screen comes into focus (includes initial mount and returning from reader)
  useFocusEffect(
    useCallback(() => {
      loadBooks();
    }, [])
  );

  const loadBooks = async () => {
    try {
      const savedBooks = await AsyncStorage.getItem('books');
      if (savedBooks) {
        const parsedBooks = JSON.parse(savedBooks);
        // Load progress for each book
        const booksWithProgress = await Promise.all(
          parsedBooks.map(async (book: Book) => {
            try {
              const saved = await AsyncStorage.getItem(`progress_${book.uri}`);
              if (saved) {
                const { percentage } = JSON.parse(saved);
                return { ...book, progress: Math.round(percentage) };
              }
            } catch (error) {
              console.error('Error loading progress for book:', error);
            }
            return book;
          })
        );
        setBooks(booksWithProgress);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const saveBooks = async (newBooks: Book[]) => {
    try {
      await AsyncStorage.setItem('books', JSON.stringify(newBooks));
      setBooks(newBooks);
    } catch (error) {
      console.error('Error saving books:', error);
      Alert.alert('Error', 'Failed to save book to library');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/epub+zip',
          'text/plain',
          'application/zip',
          'application/x-cbz',
          'application/x-cbr',
          'image/*',
        ],
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Extract filename without extension for title
        const fileName = file.name.replace(/\.(pdf|epub|txt|cbz|cbr|zip|jpg|jpeg|png)$/i, '');
        
        // Create documents directory if it doesn't exist
        const documentsDir = `${FileSystem.documentDirectory}books/`;
        const dirInfo = await FileSystem.getInfoAsync(documentsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
        }
        
        // Generate unique filename with timestamp to avoid conflicts
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || '';
        const savedFileName = `${timestamp}_${file.name}`;
        const savedUri = `${documentsDir}${savedFileName}`;
        
        // Copy file to permanent document directory
        await FileSystem.copyAsync({
          from: file.uri,
          to: savedUri,
        });
        
        // Store pending book with permanent URI
        setPendingBook({
          fileName: fileName,
          uri: savedUri,
          mimeType: file.mimeType || '',
        });
        setCustomTitle(fileName); // Pre-fill with filename
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleAddBook = () => {
    if (pendingBook) {
      const newBook: Book = {
        id: Date.now().toString(),
        title: customTitle.trim() || pendingBook.fileName,
        author: 'Unknown Author',
        uri: pendingBook.uri,
        mimeType: pendingBook.mimeType,
      };

      const updatedBooks = [newBook, ...books];
      saveBooks(updatedBooks);
      setModalVisible(false);
      setPendingBook(null);
      setCustomTitle('');
    }
  };

  const deleteBook = async (bookId: string) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to remove this book from your library?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const bookToDelete = books.find((book) => book.id === bookId);
            
            // Delete the file from document directory if it exists
            if (bookToDelete?.uri) {
              try {
                const fileInfo = await FileSystem.getInfoAsync(bookToDelete.uri);
                if (fileInfo.exists) {
                  await FileSystem.deleteAsync(bookToDelete.uri, { idempotent: true });
                }
                // Also delete progress data
                await AsyncStorage.removeItem(`progress_${bookToDelete.uri}`);
              } catch (error) {
                console.error('Error deleting file:', error);
                // Continue with removing from list even if file deletion fails
              }
            }
            
            const updatedBooks = books.filter((book) => book.id !== bookId);
            saveBooks(updatedBooks);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setModalVisible(false);
    setPendingBook(null);
    setCustomTitle('');
  };
  const renderRightActions = (bookId: string) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => deleteBook(bookId)}
    >
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderBook = ({ item }: { item: Book }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => {
          if (item.uri) {
            navigation.navigate('Reader', { book: item });
          }
        }}
      >
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookAuthor}>{item.author}</Text>
          {item.progress !== undefined && item.progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[styles.progressBarFill, { width: `${item.progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{item.progress}%</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setInfoModalVisible(true)}
        >
          <Text style={styles.infoButtonText}>i</Text>
        </TouchableOpacity>
      </View>

      {/* Books List */}
      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Book Button */}
      <TouchableOpacity style={styles.addButton} onPress={pickDocument}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Title Input Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCancel}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <Text style={styles.modalTitle}>Add Book Title</Text>
              <Text style={styles.modalSubtitle}>Optional - press Add to use filename</Text>
              
              <TextInput
                style={styles.input}
                value={customTitle}
                onChangeText={setCustomTitle}
                placeholder="Enter book title"
                placeholderTextColor="#808080"
                autoFocus={true}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addBookButton]}
                  onPress={handleAddBook}
                >
                  <Text style={styles.addBookButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Info Modal */}
      <Modal
        visible={infoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInfoModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Supported File Types</Text>
            
            <View style={styles.fileTypesList}>
              <View style={styles.fileTypeItem}>
                <Text style={styles.fileTypeIcon}>📄</Text>
                <View style={styles.fileTypeInfo}>
                  <Text style={styles.fileTypeName}>PDF</Text>
                  <Text style={styles.fileTypeDesc}>Portable Document Format</Text>
                </View>
              </View>

              <View style={styles.fileTypeItem}>
                <Text style={styles.fileTypeIcon}>📖</Text>
                <View style={styles.fileTypeInfo}>
                  <Text style={styles.fileTypeName}>EPUB</Text>
                  <Text style={styles.fileTypeDesc}>Electronic Publication</Text>
                </View>
              </View>

              <View style={styles.fileTypeItem}>
                <Text style={styles.fileTypeIcon}>📝</Text>
                <View style={styles.fileTypeInfo}>
                  <Text style={styles.fileTypeName}>TXT</Text>
                  <Text style={styles.fileTypeDesc}>Plain Text Files</Text>
                </View>
              </View>

              <View style={styles.fileTypeItem}>
                <Text style={styles.fileTypeIcon}>🎨</Text>
                <View style={styles.fileTypeInfo}>
                  <Text style={styles.fileTypeName}>CBZ / ZIP</Text>
                  <Text style={styles.fileTypeDesc}>Comic Book Archives</Text>
                </View>
              </View>

              <View style={styles.fileTypeItem}>
                <Text style={styles.fileTypeIcon}>🖼️</Text>
                <View style={styles.fileTypeInfo}>
                  <Text style={styles.fileTypeName}>Images</Text>
                  <Text style={styles.fileTypeDesc}>JPG, PNG, GIF, WebP</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.addBookButton]}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.addBookButtonText}>Got it</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#808080',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  listContent: {
    padding: 24,
  },
  bookCard: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 8,
    marginBottom: 16,
    padding: 20,
  },
  bookInfo: {
    flex: 1,
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 16,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#808080',
    borderRadius: 2,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#808080',
    width: 40,
    textAlign: 'right',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#808080',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  addBookButton: {
    backgroundColor: '#FFFFFF',
  },
  addBookButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  fileTypesList: {
    marginBottom: 24,
  },
  fileTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#808080',
  },
  fileTypeIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  fileTypeInfo: {
    flex: 1,
  },
  fileTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fileTypeDesc: {
    fontSize: 13,
    color: '#808080',
  },
});

