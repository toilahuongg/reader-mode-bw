// Check if ReaderMode is already initialized
if (!window.readerModeInstance) {
  class ReaderMode {
    constructor() {
      this.isReaderMode = false;
      this.isDarkMode = false;
      this.fontSize = 16;
      this.controls = null;
      this.originalContent = null;
      this.readerContent = null;
      this.progressBar = null;
      this.readingTime = 0;
    }

    init() {
      this.createControls();
      this.createProgressBar();
      this.attachEventListeners();
      this.hideControls();
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
        </div>
        <div class="control-group">
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
        <div class="progress-text">
          <span class="reading-time"></span>
        </div>
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

    attachEventListeners() {
      document.getElementById('readerModeBtn').addEventListener('click', () => this.toggleReaderMode());
      document.getElementById('darkModeBtn').addEventListener('click', () => this.toggleDarkMode());
      document.getElementById('decreaseFontBtn').addEventListener('click', () => this.decreaseFontSize());
      document.getElementById('increaseFontBtn').addEventListener('click', () => this.increaseFontSize());
      
      // Add scroll event listener for progress bar
      window.addEventListener('scroll', () => this.updateProgressBar());
    }

    toggleReaderMode() {
      this.isReaderMode = !this.isReaderMode;
      if (this.isReaderMode) {
        document.body.classList.add('reader-mode');
        this.activateReaderMode();
        this.showControls();
        this.showProgressBar();
      } else {
        document.body.classList.remove('reader-mode');
        this.deactivateReaderMode();
        this.hideControls();
        this.hideProgressBar();
        // Send message to reload page
        chrome.runtime.sendMessage({ action: 'reloadPage' });
      }
    }

    activateReaderMode() {
      const content = document.querySelector('.contents-post');
      if (!content) return;

      this.originalContent = content.cloneNode(true);
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
      if (!this.originalContent) return;
      
      document.body.innerHTML = '';
      document.body.appendChild(this.controls);
      document.body.appendChild(this.originalContent);
      
      if (this.isDarkMode) {
        document.body.classList.add('dark-mode');
      }
      this.updateFontSize();
    }

    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      document.body.classList.toggle('dark-mode');
      
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
    }

    decreaseFontSize() {
      this.fontSize = Math.max(12, this.fontSize - 2);
      this.updateFontSize();
    }

    increaseFontSize() {
      this.fontSize = Math.min(24, this.fontSize + 2);
      this.updateFontSize();
    }

    updateFontSize() {
      document.body.style.fontSize = `${this.fontSize}px`;
    }
  }

  // Initialize the reader mode and store the instance
  window.readerModeInstance = new ReaderMode();
  window.readerModeInstance.init();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleReaderMode' && window.readerModeInstance) {
    window.readerModeInstance.toggleReaderMode();
  }
}); 