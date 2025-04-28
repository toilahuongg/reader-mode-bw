// Check if ReaderMode is already initialized
if (!window.readerModeInstance) {
  class ReaderMode {
    constructor() {
      this.isReaderMode = false;
      this.isDarkMode = false;
      this.fontSize = 16;
      this.controls = null;
      this.readerContent = null;
      this.progressBar = null;
      this.readingTime = 0;
      this.openAIReader = null;
      this.apiKey = null;
      this.isSpeechStopped = false;
      this.selectedParagraph = null;
      this.contextMenu = null;
      this.nextParagraphAudio = null;
      this.audioMap = new Map(); // Map to store audio blobs with keys
    }

    async init() {
      this.createControls();
      this.createProgressBar();
      await this.loadSettings();
      this.attachEventListeners();
      this.hideControls();
      this.loadAPIKey();
    }

    async loadSettings() {
      try {
        const result = await chrome.storage.sync.get(['isReaderMode', 'isDarkMode', 'fontSize']);
        if (result.isReaderMode !== undefined) {
          this.isReaderMode = result.isReaderMode;
        }
        if (result.isDarkMode !== undefined) {
          this.isDarkMode = result.isDarkMode;
        }
        if (result.fontSize !== undefined) {
          this.fontSize = result.fontSize;
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    async loadAPIKey() {
      try {
        const result = await chrome.storage.sync.get('openaiApiKey');
        this.apiKey = result.openaiApiKey;
        if (this.apiKey) {
          this.openAIReader = new OpenAIReader(this.apiKey);
        }
      } catch (error) {
        console.error('Error loading API key:', error);
      }
    }

    createControls() {
      const controls = document.createElement('div');
      controls.className = 'reader-controls';
      controls.innerHTML = `
        <div class="control-group">
          <button class="reader-btn" id="darkModeBtn">
            <svg class="dark-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M12.1 22c-5.5 0-10-4.5-10-10s4.5-10 10-10c.3 0 .6 0 .9.1C10.3 2.6 8 5.7 8 9.3c0 4.4 3.6 8 8 8 3.6 0 6.7-2.3 8.2-5.6.1.3.1.6.1.9 0 5.5-4.5 10-10 10z"/>
            </svg>
            <svg class="light-icon" viewBox="0 0 24 24" width="20" height="20" style="display: none;">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
            </svg>
          </button>
          <button class="reader-btn" id="decreaseFontBtn">
            A-
          </button>
          <button class="reader-btn" id="increaseFontBtn">
            A+
          </button>
          <button class="reader-btn" id="resetBtn">
            <svg class="reset-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button class="reader-btn" id="ttsBtn" title="Text to Speech">
            <svg class="tts-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <button class="reader-btn" id="ttsPauseBtn" title="Pause Speech" style="display: none;">
            <svg class="pause-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button class="reader-btn" id="ttsStopBtn" title="Stop Speech" style="display: none;">
            <svg class="stop-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M6 6h12v12H6z"/>
            </svg>
          </button>
        </div>
        <div class="control-group">
          <button class="reader-btn" id="previousBtn">
            <svg class="previous-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button class="reader-btn" id="nextBtn">
            <svg class="next-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
          <button class="reader-btn" id="readerModeBtn"></button>
        </div>
      `;
      document.body.appendChild(controls);
      this.controls = controls;
    }

    createProgressBar() {
      const progressBar = document.createElement('div');
      progressBar.className = 'reader-progress-bar';
      progressBar.innerHTML = `
        <div class="progress-bar-fill"></div>
      `;
      document.body.appendChild(progressBar);
      this.progressBar = progressBar;
    }

    calculateReadingTime() {
      const content = document.querySelector('.reader-content');
      if (!content) return 0;

      // Get all text content
      const text = content.textContent;
      // Average reading speed: 200 words per minute
      const wordsPerMinute = 200;
      const wordCount = text.trim().split(/\s+/).length;
      const minutes = Math.ceil(wordCount / wordsPerMinute);

      return minutes;
    }

    updateProgressBar() {
      if (!this.progressBar || !this.isReaderMode) return;

      const content = document.querySelector('.reader-content');
      if (!content) return;

      const contentRect = content.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      const contentTop = contentRect.top + scrollPosition;
      const contentBottom = contentRect.bottom + scrollPosition;
      const viewportBottom = scrollPosition + viewportHeight;

      // Calculate progress percentage
      const progress = Math.min(
        100,
        Math.max(
          0,
          ((viewportBottom - contentTop) / (contentBottom - contentTop)) * 100
        )
      );

      // Update progress bar
      const progressFill = this.progressBar.querySelector('.progress-bar-fill');
      progressFill.style.width = `${progress}%`;
    }

    showProgressBar() {
      if (this.progressBar) {
        this.progressBar.style.display = 'block';
      }
    }

    hideProgressBar() {
      if (this.progressBar) {
        this.progressBar.style.display = 'none';
      }
    }

    showControls() {
      if (this.controls) {
        this.controls.style.display = 'flex';
      }
    }

    hideControls() {
      if (this.controls) {
        this.controls.style.display = 'none';
      }
    }

    reset() {
      this.setDarkMode(false);
      this.fontSize = 16;
      this.updateFontSize();
      this.updateStore();
    }

    previousPage() {
      const previousPage = document.querySelector('.reader-nav-prev > a');
      if (previousPage) {
        previousPage.click();
      }
    }

    nextPage() {
      const nextPage = document.querySelector('.reader-nav-next > a');
      if (nextPage) {
        nextPage.click();
      }
    }

    attachEventListeners() {
      document.getElementById('readerModeBtn').addEventListener('click', () => this.toggleReaderMode());
      document.getElementById('darkModeBtn').addEventListener('click', () => this.toggleDarkMode());
      document.getElementById('decreaseFontBtn').addEventListener('click', () => this.decreaseFontSize());
      document.getElementById('increaseFontBtn').addEventListener('click', () => this.increaseFontSize());
      document.getElementById('resetBtn').addEventListener('click', () => this.reset());
      document.getElementById('previousBtn').addEventListener('click', () => this.previousPage());
      document.getElementById('nextBtn').addEventListener('click', () => this.nextPage());
      document.getElementById('ttsBtn').addEventListener('click', () => this.startTextToSpeech());
      document.getElementById('ttsPauseBtn').addEventListener('click', () => this.pauseTextToSpeech());
      document.getElementById('ttsStopBtn').addEventListener('click', () => this.stopTextToSpeech());
      window.addEventListener('scroll', () => this.updateProgressBar());

      // Add paragraph selection event listeners
      document.addEventListener('click', (e) => {
        if (this.isReaderMode) {
          const paragraph = e.target.closest('.reader-paragraph');
          if (paragraph) {
            // Remove previous selection
            if (this.selectedParagraph) {
              this.selectedParagraph.classList.remove('selected');
            }
            // Set new selection
            this.selectedParagraph = paragraph;
            this.selectedParagraph.classList.add('selected');
          }
        }
      });

      // Add context menu event listeners
      document.addEventListener('contextmenu', (e) => {
        if (this.isReaderMode) {
          const paragraph = e.target.closest('.reader-paragraph');
          if (paragraph && !this.isEmptyContent(paragraph)) {
            e.preventDefault(); // Prevent default context menu
            this.showContextMenu(e, paragraph);
          }
        }
      });

      // Close context menu when clicking outside
      document.addEventListener('click', (e) => {
        if (this.contextMenu && !this.contextMenu.contains(e.target)) {
          this.contextMenu.style.display = 'none';
        }
      });
    }

    isEmptyContent(element) {
      const text = element.textContent.trim();
      return !text || text === '\u00A0' || text === '&nbsp;';
    }

    setReaderMode(isReaderMode, forceReload = false) {
      this.isReaderMode = isReaderMode;
      this.updateStore();
      if (this.isReaderMode) {
        document.body.classList.add('reader-mode');
        this.activateReaderMode();
        this.showControls();
        this.showProgressBar();
      } else {
        this.deactivateReaderMode();
        if (forceReload) {
          window.location.reload();
        }
      }
    }

    toggleReaderMode() {
      this.setReaderMode(!this.isReaderMode, true);
    }

    activateReaderMode() {
      const content = document.querySelector('.contents-post');
      if (!content) return;

      this.readerContent = content.cloneNode(true);

      // Clear the page
      document.body.innerHTML = '';
      document.body.appendChild(this.controls);
      document.body.appendChild(this.progressBar);

      // Create reader container
      const readerContainer = document.createElement('div');
      readerContainer.className = 'reader-container';

      // Get post contents
      const postContents = this.readerContent.querySelector('.post-contents');
      if (postContents) {
        // Create book info section
        const bookInfo = document.createElement('div');
        bookInfo.className = 'reader-book-info';

        // Add book title from post-header
        const bookTitle = this.readerContent.querySelector('.post-header');
        if (bookTitle) {
          const bookTitleContainer = document.createElement('div');
          bookTitleContainer.className = 'reader-book-title';
          bookTitleContainer.textContent = bookTitle.textContent.trim();
          bookInfo.appendChild(bookTitleContainer);
        }

        // Add chapter number
        const chapterNumber = postContents.querySelector('h6');
        if (chapterNumber) {
          const chapterNumberContainer = document.createElement('div');
          chapterNumberContainer.className = 'reader-chapter-number';
          chapterNumberContainer.textContent = chapterNumber.textContent;
          bookInfo.appendChild(chapterNumberContainer);
        }

        // Add chapter title
        const chapterTitle = postContents.querySelector('h1');
        if (chapterTitle) {
          const chapterTitleContainer = document.createElement('div');
          chapterTitleContainer.className = 'reader-chapter-title';
          chapterTitleContainer.textContent = chapterTitle.textContent;
          bookInfo.appendChild(chapterTitleContainer);
        }

        readerContainer.appendChild(bookInfo);

        // Create content section
        const contentSection = document.createElement('div');
        contentSection.className = 'reader-content';

        // Filter out unwanted elements from content
        const clonedContent = this.readerContent.cloneNode(true);
        Array.from(clonedContent.querySelectorAll('.post-contents > *')).forEach(element => {
          // Skip specific elements that are already handled
          if (element.matches('h6, h1, .navigation, .post-header, .btn-wrap')) {
            return;
          }
          const text = element.textContent;
          if (!text || text === '\u00A0' || text === '&nbsp;' || text === ' ') {
            return;
          }

          // Preserve original HTML tags for specific elements
          if (element.matches('h2, h3, h4, blockquote, ol, ul, li')) {
            contentSection.appendChild(element.cloneNode(true));
            return;
          }

          // For other elements, wrap in paragraph
          const paragraph = document.createElement('div');
          paragraph.className = 'reader-paragraph';
          paragraph.innerHTML = element.innerHTML;
          contentSection.appendChild(paragraph);
        });

        readerContainer.appendChild(contentSection);

        // Add navigation from post-contents
        const navigation = postContents.querySelector('.navigation');
        if (navigation) {
          const readerNavigation = document.createElement('div');
          readerNavigation.className = 'reader-navigation';

          const navContainer = document.createElement('div');
          navContainer.className = 'reader-nav-container';

          // Copy navigation content
          navContainer.innerHTML = navigation.innerHTML;

          // Update classes for styling
          const prevLink = navContainer.querySelector('.page-prev');
          const nextLink = navContainer.querySelector('.page-next');

          if (prevLink) {
            prevLink.className = 'reader-nav-prev';
          }

          if (nextLink) {
            nextLink.className = 'reader-nav-next';
          }

          readerNavigation.appendChild(navContainer);
          readerContainer.appendChild(readerNavigation);
        }

        document.body.appendChild(readerContainer);

        // Calculate and store reading time after content is created
        this.readingTime = this.calculateReadingTime();

        // Add reading time after calculation
        const readingTimeContainer = document.createElement('div');
        readingTimeContainer.className = 'reader-reading-time';
        readingTimeContainer.textContent = `~${this.readingTime} min read`;
        bookInfo.appendChild(readingTimeContainer);

        // Apply current styles
        if (this.isDarkMode) {
          document.body.classList.add('dark-mode');
        }
        this.updateFontSize();
        this.updateProgressBar();
      }
    }

    deactivateReaderMode() {
      this.isReaderMode = false;
      this.updateStore();
    }

    setDarkMode(isDarkMode) {
      this.isDarkMode = isDarkMode;
      document.body.classList.toggle('dark-mode', isDarkMode);

      // Toggle dark/light icons
      const darkIcon = document.querySelector('.dark-icon');
      const lightIcon = document.querySelector('.light-icon');
      if (this.isDarkMode) {
        darkIcon.style.display = 'none';
        lightIcon.style.display = 'block';
      } else {
        darkIcon.style.display = 'block';
        lightIcon.style.display = 'none';
      }
      this.updateStore();
    }

    toggleDarkMode() {
      this.setDarkMode(!this.isDarkMode);
    }

    decreaseFontSize() {
      this.fontSize = Math.max(12, this.fontSize - 2);
      this.updateFontSize();
      this.updateStore();
    }

    increaseFontSize() {
      this.fontSize = Math.min(24, this.fontSize + 2);
      this.updateFontSize();
      this.updateStore();
    }

    updateFontSize() {
      document.body.style.fontSize = `${this.fontSize}px`;
    }

    async setConfig(isReaderMode, isDarkMode, fontSize) {
      this.fontSize = fontSize;
      this.isDarkMode = isDarkMode;
      this.setReaderMode(isReaderMode);
    }

    async updateStore() {
      try {
        await chrome.storage.sync.set({
          isReaderMode: this.isReaderMode,
          isDarkMode: this.isDarkMode,
          fontSize: this.fontSize
        });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }

    // Helper method to generate a key for the audio map
    generateAudioKey(text) {
      const key = text.substring(0, 50).replace(/\s+/g, '_'); // Use first 50 chars of text as key
      console.log('Generated audio key:', key);
      return key;
    }

    // Helper method to clean up audio resources
    cleanupAudio(key) {
      if (this.audioMap.has(key)) {
        const { audio, url } = this.audioMap.get(key);
        if (url) {
          URL.revokeObjectURL(url);
        }
        this.audioMap.delete(key);
        console.log('Cleaned up audio for key:', key);
      }
    }

    async preloadNextParagraph(text) {
      const key = this.generateAudioKey(text);
      
      // Clean up existing audio if any
      this.cleanupAudio(key);

      try {
        const audioBlob = await this.openAIReader.getAudioBlob(text);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.volume = 1.0;
        audio.playbackRate = 1.0;
        
        // Store audio in map
        this.audioMap.set(key, { audio, url: audioUrl });
        console.log('Preloaded audio for key:', key);
        console.log('Current audioMap size:', this.audioMap.size);
        console.log('Current audioMap keys:', Array.from(this.audioMap.keys()));
      } catch (error) {
        console.error('Error preloading next paragraph:', error);
      }
    }

    async startTextToSpeech() {
      if (!this.openAIReader) {
        alert('Please set your OpenAI API key in the extension settings.');
        return;
      }

      try {
        // Get elements from reader-content and filter out empty ones
        const allElements = document.querySelectorAll('.reader-content > *');
        const elements = Array.from(allElements).filter(element => !this.isEmptyContent(element));

        // If a paragraph is selected, start from that paragraph
        let startIndex = 0;
        if (this.selectedParagraph) {
          startIndex = elements.indexOf(this.selectedParagraph);
          if (startIndex === -1) startIndex = 0;
        }

        document.getElementById('ttsBtn').style.display = 'none';
        document.getElementById('ttsPauseBtn').style.display = 'block';
        document.getElementById('ttsStopBtn').style.display = 'block';

        // Preload first paragraph and next paragraph
        const firstText = elements[startIndex].textContent.trim();
        if (firstText) {
          const firstKey = this.generateAudioKey(firstText);
          if (!this.audioMap.has(firstKey)) {
            console.log('Loading first paragraph audio for key:', firstKey);
            await this.preloadNextParagraph(firstText);
          }
        }

        if (startIndex < elements.length - 1) {
          const nextText = elements[startIndex + 1].textContent.trim();
          if (nextText) {
            const nextKey = this.generateAudioKey(nextText);
            if (!this.audioMap.has(nextKey)) {
              console.log('Preloading next paragraph audio for key:', nextKey);
              await this.preloadNextParagraph(nextText);
            }
          }
        }

        // Read each element sequentially starting from selected paragraph
        for (let i = startIndex; i < elements.length; i++) {
          const element = elements[i];
          if (this.isSpeechStopped) break;
          
          // Scroll element into view
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight class
          if (element.classList.contains('reader-paragraph')) {
            element.classList.add('highlight');
          }
          
          // Get text content
          const text = element.textContent.trim();
          if (!text) continue;

          // Preload next paragraph if exists
          if (i < elements.length - 1) {
            const nextElement = elements[i + 1];
            const nextText = nextElement.textContent.trim();
            if (nextText) {
              const nextKey = this.generateAudioKey(nextText);
              if (!this.audioMap.has(nextKey)) {
                console.log('Preloading next paragraph audio for key:', nextKey);
                await this.preloadNextParagraph(nextText);
              }
            }
          }

          // Create a promise that resolves when the element is read
          await new Promise((resolve) => {
            const key = this.generateAudioKey(text);
            let audio;
            let audioUrl;

            const playAudio = () => {
              audio.onended = () => {
                if (audioUrl) {
                  URL.revokeObjectURL(audioUrl);
                }
                if (element.classList.contains('reader-paragraph')) {
                  element.classList.remove('highlight');
                }
                console.log('Finished playing audio for key:', key);
                resolve();
              };

              audio.play().catch(error => {
                console.error('Error playing audio:', error);
                if (audioUrl) {
                  URL.revokeObjectURL(audioUrl);
                }
                resolve();
              });
            };

            // Get audio from map
            if (this.audioMap.has(key)) {
              const audioData = this.audioMap.get(key);
              audio = audioData.audio;
              audioUrl = audioData.url;
              this.audioMap.delete(key); // Remove from map after use
              console.log('Using audio from map for key:', key);
              playAudio();
            } else {
              // This should not happen as we preload above
              console.error('Audio not found in map for key:', key);
              resolve();
            }
          });
        }

        // Clean up any remaining audio resources
        this.audioMap.forEach((_, key) => this.cleanupAudio(key));
        this.audioMap.clear();
        console.log('Cleaned up all audio resources');

        // Reset button states when speech ends
        document.getElementById('ttsBtn').style.display = 'block';
        document.getElementById('ttsPauseBtn').style.display = 'none';
        document.getElementById('ttsStopBtn').style.display = 'none';
      } catch (error) {
        console.error('Error with text-to-speech:', error);
        alert('Error with text-to-speech. Please try again.');
        // Reset button states on error
        document.getElementById('ttsBtn').style.display = 'block';
        document.getElementById('ttsPauseBtn').style.display = 'none';
        document.getElementById('ttsStopBtn').style.display = 'none';
      }
    }

    pauseTextToSpeech() {
      if (this.openAIReader) {
        this.openAIReader.pauseSpeech();
        document.getElementById('ttsPauseBtn').style.display = 'none';
        document.getElementById('ttsBtn').style.display = 'block';
      }
    }

    stopTextToSpeech() {
      this.isSpeechStopped = true;
      
      // Clean up all audio resources
      this.audioMap.forEach((_, key) => this.cleanupAudio(key));
      this.audioMap.clear();
      console.log('Stopped and cleaned up all audio resources');
      
      document.getElementById('ttsPauseBtn').style.display = 'none';
      document.getElementById('ttsStopBtn').style.display = 'none';
      document.getElementById('ttsBtn').style.display = 'block';
    }

    getPageContent() {
      // Get the main content of the page
      const article = document.querySelector('article') ||
        document.querySelector('main') ||
        document.querySelector('.content') ||
        document.body;

      return article.innerText;
    }

    createContextMenu() {
      if (this.contextMenu) {
        document.body.removeChild(this.contextMenu);
      }

      const menu = document.createElement('div');
      menu.className = 'reader-context-menu';
      menu.innerHTML = `
        <div class="menu-item" data-action="start-reading">Bắt đầu đọc từ đây</div>
        <div class="menu-item" data-action="cancel">Hủy</div>
      `;
      document.body.appendChild(menu);
      this.contextMenu = menu;

      // Add click handlers for menu items
      menu.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          if (action === 'start-reading' && this.selectedParagraph) {
            this.startTextToSpeech();
          }
          menu.style.display = 'none';
        });
      });
    }

    showContextMenu(e, paragraph) {
      if (!this.contextMenu) {
        this.createContextMenu();
      }

      // Position the menu at cursor
      const menu = this.contextMenu;
      menu.style.left = `${e.pageX}px`;
      menu.style.top = `${e.pageY}px`;
      menu.style.display = 'block';

      // Store the selected paragraph
      this.selectedParagraph = paragraph;
    }
  }

  // Initialize the reader mode and store the instance
  window.readerModeInstance = new ReaderMode();
  window.readerModeInstance.init();
}

// Load saved configuration
chrome.storage.sync.get(['isReaderMode', 'isDarkMode', 'fontSize'], (result) => {
  if (window.readerModeInstance) {
    console.log('Setting configuration:', result);
    window.readerModeInstance.setConfig(
      result.isReaderMode || false,
      result.isDarkMode || false,
      result.fontSize || 16
    );
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleReaderMode' && window.readerModeInstance) {
    window.readerModeInstance.toggleReaderMode();
  }
});

// Listen for messages from popup

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateReaderMode' && window.readerModeInstance) {
    window.readerModeInstance.setReaderMode(message.enabled, true);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateDarkMode' && window.readerModeInstance) {
    window.readerModeInstance.setDarkMode(message.enabled);
  }
});
