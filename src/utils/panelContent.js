import { PanelDocument } from "@iwsdk/core";
import { logger } from "./logger.js";

/**
 * Binds content (title, description, image) to a panel entity.
 *
 * @param {Entity} entity - Panel entity with PanelUI component
 * @param {Object} content - Content to bind
 * @param {string} content.title - Panel title text
 * @param {string} content.description - Panel description text
 * @param {string} content.image - Image source URL
 * @param {number} maxAttempts - Number of RAF retries while waiting for document
 */
export function bindPanelContent(entity, content, maxAttempts = 60) {
  function attemptBinding(attempt = 0) {
    try {
      const document = PanelDocument.data.document[entity.index];
      if (!document) {
        if (attempt < maxAttempts) {
          setTimeout(() => attemptBinding(attempt + 1), 50);
        } else {
          logger.warn(`[PanelContent] Document not ready for entity ${entity.index} after ${maxAttempts} attempts`);
        }
        return;
      }

    // Bind title
    if (content.title) {
      const titleElement = document.getElementById?.("panel-title");
      if (titleElement) {
        if (titleElement.setProperties) {
          titleElement.setProperties({ text: content.title });
        } else if (titleElement.textContent !== undefined) {
          titleElement.textContent = content.title;
        } else if (titleElement.innerText !== undefined) {
          titleElement.innerText = content.title;
        }
        logger.debug(`[PanelContent] Set title: ${content.title}`);
      } else {
        logger.warn(`[PanelContent] Title element not found for entity ${entity.index}`);
      }
    }

    // Bind description
    if (content.description) {
      const descriptionElement = document.getElementById?.("panel-description");
      if (descriptionElement) {
        if (descriptionElement.setProperties) {
          descriptionElement.setProperties({ text: content.description });
        } else if (descriptionElement.textContent !== undefined) {
          descriptionElement.textContent = content.description;
        } else if (descriptionElement.innerText !== undefined) {
          descriptionElement.innerText = content.description;
        }
        logger.debug(`[PanelContent] Set description: ${content.description}`);
      } else {
        logger.warn(`[PanelContent] Description element not found for entity ${entity.index}`);
      }
    }

    // Bind image - always set a src, even if empty, to avoid missing src property errors
    const imageElement = document.getElementById?.("panel-image");
    if (imageElement) {
      const imageSrc = content.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

      // Add error handler for image loading failures
      const handleImageError = () => {
        logger.warn(`[PanelContent] Image failed to load: ${imageSrc} for entity ${entity.index}`);
        // Set placeholder on error
        if (imageElement.setProperties) {
          imageElement.setProperties({ src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E" });
        } else if (imageElement.src !== undefined) {
          imageElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";
        }
      };

      // Simple image setting with minimal error handling
      if (imageElement.setProperties) {
        imageElement.setProperties({ src: imageSrc });
        logger.info(`[PanelContent] Set image: ${imageSrc}`);
      } else {
        logger.warn(`[PanelContent] No setProperties method for entity ${entity.index}`);
      }

    } else {
      logger.warn(`[PanelContent] Image element not found for entity ${entity.index}`);
    }

    logger.info(`[PanelContent] Content bound for entity ${entity.index}`);
    
    } catch (error) {
      logger.error(`[PanelContent] Error binding content for entity ${entity.index}:`, error);
    }
  }

  attemptBinding();
}

