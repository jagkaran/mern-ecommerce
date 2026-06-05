const cloudinary = require("cloudinary").v2;
const logger = require("../utils/logger");

class StorageService {
  async uploadImage(dataUri, folder, options = {}) {
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        ...options,
      });
      return { public_id: result.public_id, url: result.secure_url };
    } catch (error) {
      logger.error(`Cloudinary upload failed [${folder}]: ${error.message}`);
      throw new Error("Image upload failed. Please try again.");
    }
  }

  async uploadMany(dataUris, folder, options = {}) {
    return Promise.all(
      dataUris.map((uri) => this.uploadImage(uri, folder, options))
    );
  }

  async destroyImage(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      logger.warn(`Cloudinary destroy failed [${publicId}]: ${error.message}`);
    }
  }

  async destroyMany(images) {
    return Promise.all(images.map((img) => this.destroyImage(img.public_id)));
  }

  async uploadAvatar(dataUri) {
    return this.uploadImage(dataUri, "avatars", { width: 200, crop: "scale" });
  }

  async uploadProductImage(dataUri) {
    return this.uploadImage(dataUri, "products");
  }

  /**
   * Upload a raw Buffer (e.g. from multer MemoryStorage) to Cloudinary.
   * Cloudinary accepts Buffer directly, so no data-URI conversion needed.
   * @param {Buffer} buffer
   * @param {string} [folder]
   * @param {object} [options]
   * @returns {Promise<{public_id: string, url: string}>}
   */
  async uploadBuffer(buffer, folder, options = {}) {
    return this.uploadImage(buffer, folder, options);
  }
}

module.exports = new StorageService();
