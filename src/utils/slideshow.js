import { PanelDocument } from "@iwsdk/core";
import { logger } from "./logger.js";

/**
 * Creates and manages an image slideshow on a panel entity.
 * Cycles through images at a specified interval.
 *
 * @param {Entity} entity - Panel entity with PanelUI component
 * @param {string[]} images - Array of image paths to cycle through
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Time in milliseconds between slides (default: 3000)
 * @param {string} options.imageElementId - ID of the image element in the panel (default: "panel-image")
 * @param {number} options.maxAttempts - Number of RAF retries while waiting for document (default: 120)
 */
export function createSlideshow(entity, images, options = {}) {
  const {
    interval = 3000,
    imageElementId = "panel-image",
    maxAttempts = 120
  } = options;

  if (!images || images.length === 0) {
    logger.warn("[Slideshow] No images provided");
    return null;
  }

  let currentIndex = 0;
  let slideshowInterval = null;
  let imageElement = null;

  function attemptSetup(attempt = 0) {
    const document = PanelDocument.data.document[entity.index];
    if (!document) {
      if (attempt < maxAttempts) {
        requestAnimationFrame(() => attemptSetup(attempt + 1));
      } else {
        logger.warn(
          `[Slideshow] Document not ready for entity ${entity.index} after ${maxAttempts} attempts`
        );
      }
      return;
    }

    // Try to find image element by ID first, then by tag name
    imageElement = document.getElementById?.(imageElementId);
    if (!imageElement) {
      // Fallback: find first img element in the document
      const imgElements = document.querySelectorAll?.("img");
      if (imgElements && imgElements.length > 0) {
        imageElement = imgElements[0];
      }
    }

    if (!imageElement) {
      if (attempt < maxAttempts) {
        requestAnimationFrame(() => attemptSetup(attempt + 1));
        return;
      } else {
        logger.warn(`[Slideshow] Image element not found for entity ${entity.index}`);
        return;
      }
    }

    // Set initial image
    updateImage(images[0]);

    // Start slideshow
    slideshowInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      updateImage(images[currentIndex]);
    }, interval);

    logger.debug(`[Slideshow] Started slideshow for entity ${entity.index} with ${images.length} images`);
  }

  function updateImage(imagePath) {
    if (imageElement) {
      // Add error handler for failed image loads with more context
      const handleError = (event) => {
        logger.warn(`[Slideshow] Image failed to load: ${imagePath}`, {
          entity: entity.index,
          event: event,
          element: imageElement
        });
      };

      // Remove previous error listener if exists
      if (imageElement.removeEventListener) {
        imageElement.removeEventListener("error", handleError);
      }

      logger.debug(`[Slideshow] Updating image for entity ${entity.index}: ${imagePath}`);

      // Try setProperties first (UIKitML elements)
      if (imageElement.setProperties) {
        try {
          imageElement.setProperties({ src: imagePath });
          imageElement.addEventListener("error", handleError, { once: true });
          logger.debug(`[Slideshow] Used setProperties for entity ${entity.index}`);
        } catch (e) {
          logger.warn(`[Slideshow] setProperties failed for entity ${entity.index}: ${e.message}`);
        }
      }
      // Fallback to direct property assignment
      else if (imageElement.src !== undefined) {
        imageElement.src = imagePath;
        imageElement.addEventListener("error", handleError, { once: true });
        logger.debug(`[Slideshow] Used direct src assignment for entity ${entity.index}`);
      }
      // Try setAttribute as last resort
      else if (imageElement.setAttribute) {
        imageElement.setAttribute("src", imagePath);
        imageElement.addEventListener("error", handleError, { once: true });
        logger.debug(`[Slideshow] Used setAttribute for entity ${entity.index}`);
      }
    } else {
      logger.warn(`[Slideshow] No image element found for entity ${entity.index}`);
    }
  }

  // Store cleanup function on entity for disposal
  entity.object3D.userData.slideshowCleanup = () => {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
      logger.debug(`[Slideshow] Stopped slideshow for entity ${entity.index}`);
    }
  };

  attemptSetup();
  return entity;
}

/**
 * Stops and cleans up a slideshow on an entity.
 * @param {Entity} entity - Panel entity with slideshow
 */
export function stopSlideshow(entity) {
  if (entity.object3D.userData.slideshowCleanup) {
    entity.object3D.userData.slideshowCleanup();
    delete entity.object3D.userData.slideshowCleanup;
  }
}

