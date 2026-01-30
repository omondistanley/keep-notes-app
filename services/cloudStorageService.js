/**
 * Cloud Storage Service (Mocked)
 * Handles Google Drive, Dropbox, OneDrive integration
 */

class CloudStorageService {
  /**
   * Generate mock files
   */
  generateMockFiles(provider, count = 5) {
    const files = [];
    const fileTypes = ["pdf", "docx", "xlsx", "pptx", "jpg", "png"];
    
    for (let i = 0; i < count; i++) {
      const type = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      files.push({
        id: `file_${provider}_${i}`,
        name: `Document ${i + 1}.${type}`,
        mimeType: this.getMimeType(type),
        size: Math.floor(Math.random() * 10000000),
        webViewLink: `https://${provider}.example.com/file/${i}`,
        thumbnailLink: `https://${provider}.example.com/thumb/${i}`,
        modifiedTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    return files;
  }

  /**
   * Get MIME type
   */
  getMimeType(extension) {
    const types = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      png: "image/png"
    };
    return types[extension] || "application/octet-stream";
  }

  /**
   * List files from provider
   */
  async listFiles(provider, folderId = null) {
    return this.generateMockFiles(provider, 10);
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(provider, fileId) {
    const files = this.generateMockFiles(provider, 1);
    return files[0];
  }
}

module.exports = new CloudStorageService();

