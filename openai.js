// OpenAI API integration for content reading
class OpenAIReader {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    this.ttsUrl = 'https://api.openai.com/v1/audio/speech';
    this.maxTokensPerChunk = 4000; // Maximum tokens per API call
    this.maxTTSLength = 4000; // Set to 4000 to be safe (below the 4096 limit)
    this.currentAudio = null;
    this.isStopped = false;
  }

  // Split content into chunks based on token limit or TTS length limit
  splitContent(content, forTTS = false) {
    if (forTTS) {
      // Split for TTS API (max 4000 characters to be safe)
      const chunks = [];
      let currentChunk = '';
      let currentLength = 0;

      // First split by paragraphs
      const paragraphs = content.split(/\n\s*\n/);
      
      for (const paragraph of paragraphs) {
        // Then split by sentences
        const sentences = paragraph.split(/([.!?]+\s+)/);
        
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i].trim();
          if (!sentence) continue;

          // If a single sentence is too long, split it into words
          if (sentence.length > this.maxTTSLength) {
            const words = sentence.split(/\s+/);
            let tempChunk = '';
            let tempLength = 0;
            
            for (const word of words) {
              // Add space if not first word
              const spaceLength = tempChunk ? 1 : 0;
              
              // If adding this word would exceed the limit
              if (tempLength + word.length + spaceLength > this.maxTTSLength) {
                // Save current chunk if it's not empty
                if (tempChunk) {
                  chunks.push(tempChunk);
                  tempChunk = '';
                  tempLength = 0;
                }
                
                // If a single word is too long, split it into smaller parts
                if (word.length > this.maxTTSLength) {
                  const parts = this.splitLongWord(word);
                  chunks.push(...parts);
                } else {
                  tempChunk = word;
                  tempLength = word.length;
                }
              } else {
                // Add word to current chunk
                tempChunk += (tempChunk ? ' ' : '') + word;
                tempLength += word.length + spaceLength;
              }
            }
            
            // Add remaining chunk if any
            if (tempChunk) {
              chunks.push(tempChunk);
            }
          } else {
            // If adding this sentence would exceed the limit
            if (currentLength + sentence.length + (currentChunk ? 1 : 0) > this.maxTTSLength) {
              // Save current chunk if it's not empty
              if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = '';
                currentLength = 0;
              }
              
              // Add sentence to new chunk
              currentChunk = sentence;
              currentLength = sentence.length;
            } else {
              // Add sentence to current chunk
              currentChunk += (currentChunk ? ' ' : '') + sentence;
              currentLength += sentence.length + (currentChunk ? 1 : 0);
            }
          }
        }
        
        // Add remaining chunk if any
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
          currentLength = 0;
        }
      }
      
      // Final check to ensure no chunk exceeds the limit
      return chunks.map(chunk => {
        if (chunk.length > this.maxTTSLength) {
          console.warn('Chunk exceeded limit:', chunk.length);
          return chunk.substring(0, this.maxTTSLength);
        }
        return chunk;
      });
    } else {
      // Original token-based splitting for other APIs
      const words = content.split(/\s+/);
      const chunks = [];
      let currentChunk = [];
      let currentLength = 0;

      for (const word of words) {
        const wordTokens = Math.ceil(word.length / 4);
        
        if (currentLength + wordTokens > this.maxTokensPerChunk) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [word];
          currentLength = wordTokens;
        } else {
          currentChunk.push(word);
          currentLength += wordTokens;
        }
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
      }

      return chunks;
    }
  }

  // Helper method to split very long words
  splitLongWord(word) {
    const chunks = [];
    let start = 0;
    
    while (start < word.length) {
      const end = Math.min(start + this.maxTTSLength, word.length);
      chunks.push(word.substring(start, end));
      start = end;
    }
    
    return chunks;
  }

  // Text to Speech function using OpenAI TTS API
  async textToSpeech(text, options = {}) {
    try {
      console.log('Starting text-to-speech...');
      const chunks = this.splitContent(text, true);
      console.log(`Split into ${chunks.length} chunks`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} characters)`);

        // Double check length before sending
        if (chunk.length > this.maxTTSLength) {
          console.error('Chunk still too long:', chunk.length);
          continue;
        }

        const response = await fetch(this.ttsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'tts-1-hd',
            input: chunk,
            voice: 'alloy',
            response_format: 'mp3'
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI TTS API error: ${response.statusText}`);
        }

        console.log('Received audio response');

        // Convert response to audio blob
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create and play audio
        const audio = new Audio(audioUrl);
        audio.volume = options.volume || 1.0;
        audio.playbackRate = options.rate || 1.0;

        // Store current audio for control
        this.currentAudio = audio;

        // Wait for this chunk to finish before playing the next one
        await new Promise((resolve, reject) => {
          audio.onended = () => {
            console.log(`Finished playing chunk ${i + 1}`);
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            resolve();
          };

          audio.onerror = (error) => {
            console.error('Audio playback error:', error);
            URL.revokeObjectURL(audioUrl);
            this.currentAudio = null;
            reject(error);
          };

          audio.onplay = () => {
            console.log(`Started playing chunk ${i + 1}`);
          };

          audio.onpause = () => {
            console.log(`Paused chunk ${i + 1}`);
          };

          // Play the audio
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Error playing audio:', error);
              URL.revokeObjectURL(audioUrl);
              this.currentAudio = null;
              reject(error);
            });
          }
        });
      }
      
      console.log('Finished all chunks');
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      throw error;
    }
  }

  async getAudioBlob(text) {
    try {
      const response = await fetch(this.ttsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: text,
          voice: 'alloy',
          response_format: 'mp3'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error getting audio blob:', error);
      throw error;
    }
  }

  // Stop current speech
  stopSpeech() {
    this.isStopped = true;
    if (this.currentAudio) {
      console.log('Stopping current speech');
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  // Pause current speech
  pauseSpeech() {
    if (this.currentAudio && !this.currentAudio.paused) {
      console.log('Pausing speech');
      this.currentAudio.pause();
    }
  }

  // Resume paused speech
  resumeSpeech() {
    if (this.currentAudio && this.currentAudio.paused) {
      console.log('Resuming speech');
      this.currentAudio.play().catch(error => {
        console.error('Error resuming speech:', error);
      });
    }
  }

  // Read content with text-to-speech
  async readContent(content, options = {}) {
    try {
      const chunks = this.splitContent(content);
      
      for (const chunk of chunks) {
        if (this.isStopped) break;
        
        await this.textToSpeech(chunk, {
          rate: options.rate || 1.0,
          volume: options.volume || 1.0
        });
      }

      // Call onEnd callback when all chunks are read
      if (options.onEnd && !this.isStopped) {
        options.onEnd();
      }
    } catch (error) {
      console.error('Error reading content with text-to-speech:', error);
      throw error;
    }
  }

  // Summarize content (kept for backward compatibility)
  async summarizeContent(content, options = {}) {
    try {
      const chunks = this.splitContent(content);
      let fullSummary = '';

      for (const chunk of chunks) {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: options.model || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that creates concise summaries of content. If you receive partial content, provide a summary of that part.'
              },
              {
                role: 'user',
                content: `Please create a concise summary of the following content: ${chunk}`
              }
            ],
            temperature: options.temperature || 0.5,
            max_tokens: options.maxTokens || 500
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        fullSummary += data.choices[0].message.content + '\n\n';
      }

      if (chunks.length > 1) {
        const finalResponse = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: options.model || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that creates a concise final summary from multiple partial summaries.'
              },
              {
                role: 'user',
                content: `Please create a concise final summary from these partial summaries: ${fullSummary}`
              }
            ],
            temperature: options.temperature || 0.5,
            max_tokens: options.maxTokens || 500
          })
        });

        if (!finalResponse.ok) {
          throw new Error(`OpenAI API error: ${finalResponse.statusText}`);
        }

        const finalData = await finalResponse.json();
        return finalData.choices[0].message.content;
      }

      return fullSummary;
    } catch (error) {
      console.error('Error summarizing content with OpenAI:', error);
      throw error;
    }
  }
}

// Export the class
window.OpenAIReader = OpenAIReader; 