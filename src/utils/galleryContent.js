import { PanelDocument } from "@iwsdk/core";
import { logger } from "./logger.js";

/**
 * Binds gallery content (title, description, 4 thumbnails) to a gallery panel entity.
 *
 * @param {Entity} entity - Panel entity with PanelUI component
 * @param {Object} content - Content to bind
 * @param {string} content.title - Panel title text
 * @param {string} content.description - Panel description text (reduced)
 * @param {string[]} content.thumbnails - Array of 4 image URLs for thumbnails
 * @param {Function} onThumbnailClick - Callback function when thumbnail is clicked (receives imageSrc)
 * @param {number} maxAttempts - Number of RAF retries while waiting for document
 */
export function bindGalleryContent(entity, content, onThumbnailClick = null, maxAttempts = 200) {
  function attemptBinding(attempt = 0) {
    try {
      // Check if entity.index is valid
      if (entity.index === undefined || entity.index === null) {
        if (attempt < maxAttempts) {
          requestAnimationFrame(() => attemptBinding(attempt + 1));
        } else {
          logger.warn(
            `[GalleryContent] Entity index not available after ${maxAttempts} attempts`
          );
        }
        return;
      }

      const document = PanelDocument.data.document[entity.index];
      if (!document) {
        if (attempt < maxAttempts) {
          requestAnimationFrame(() => attemptBinding(attempt + 1));
        } else {
          logger.warn(
            `[GalleryContent] Document not ready for entity ${entity.index} after ${maxAttempts} attempts`
          );
        }
        return;
      }

      // Bind title
      if (content.title) {
        let titleElement = document.getElementById?.("panel-title");
        if (!titleElement && document.querySelector) {
          titleElement = document.querySelector("#panel-title");
        }
        if (!titleElement && document.querySelector) {
          titleElement = document.querySelector(".gallery-title");
        }

        if (titleElement) {
          if (titleElement.setProperties) {
            titleElement.setProperties({ text: content.title });
          } else if (titleElement.textContent !== undefined) {
            titleElement.textContent = content.title;
          } else if (titleElement.innerText !== undefined) {
            titleElement.innerText = content.title;
          }
          logger.debug(`[GalleryContent] Set title: ${content.title}`);
        }
      }

      // Bind description (reduced text)
      if (content.description) {
        let descriptionElement = document.getElementById?.("panel-description");
        if (!descriptionElement && document.querySelector) {
          descriptionElement = document.querySelector("#panel-description");
        }
        if (!descriptionElement && document.querySelector) {
          descriptionElement = document.querySelector(".gallery-description");
        }

        if (descriptionElement) {
          // Use shorter description
          const shortDescription = content.description.length > 50
            ? content.description.substring(0, 50) + "..."
            : content.description;

          if (descriptionElement.setProperties) {
            descriptionElement.setProperties({ text: shortDescription });
          } else if (descriptionElement.textContent !== undefined) {
            descriptionElement.textContent = shortDescription;
          } else if (descriptionElement.innerText !== undefined) {
            descriptionElement.innerText = shortDescription;
          }
          logger.debug(`[GalleryContent] Set description: ${shortDescription}`);
        }
      }

      // Bind 4 thumbnails
      if (content.thumbnails && Array.isArray(content.thumbnails)) {
        const thumbnails = content.thumbnails.slice(0, 4); // Ensure max 4 thumbnails
        logger.info(`[GalleryContent] Binding ${thumbnails.length} thumbnails for entity ${entity.index}`, thumbnails);

        // First, try to find all thumbnail elements to verify they exist
        if (document.querySelectorAll) {
          const allThumbnails = document.querySelectorAll('.gallery-thumbnail');
          logger.info(`[GalleryContent] Found ${allThumbnails.length} thumbnail elements in document for entity ${entity.index}`);
        }

        thumbnails.forEach((thumbnailSrc, index) => {
          const thumbnailId = `thumbnail-${index + 1}`;
          logger.info(`[GalleryContent] Processing thumbnail ${index + 1}/${thumbnails.length}: ${thumbnailId} -> ${thumbnailSrc}`);
          
          // Use the PanelUI document (already retrieved above)
          let thumbnailElement = document.getElementById?.(thumbnailId);

          if (!thumbnailElement && document.querySelector) {
            thumbnailElement = document.querySelector(`#${thumbnailId}`);
          }

          if (!thumbnailElement && document.querySelector) {
            // Try finding by class and index as fallback
            const allThumbnails = document.querySelectorAll?.('.gallery-thumbnail');
            logger.info(`[GalleryContent] Fallback: Found ${allThumbnails?.length || 0} thumbnails by class for entity ${entity.index}`);
            if (allThumbnails && allThumbnails.length > index) {
              thumbnailElement = allThumbnails[index];
              logger.info(`[GalleryContent] Found thumbnail ${index} by class selector (fallback): ${thumbnailElement.id || 'no-id'}`);
            }
          }
          
          if (thumbnailElement) {
            logger.info(`[GalleryContent] Found thumbnail element ${thumbnailId} for entity ${entity.index}`);
          } else {
            logger.warn(`[GalleryContent] Thumbnail element ${thumbnailId} NOT FOUND in document for entity ${entity.index}`);
            // Try to log available elements for debugging
            if (document.querySelectorAll) {
              const allImages = document.querySelectorAll("img");
              logger.warn(`[GalleryContent] Available img elements in document: ${allImages.length}`);
              allImages.forEach((img, idx) => {
                logger.warn(`[GalleryContent]   img[${idx}]: id=${img.id}, class=${img.className}`);
              });
            }
          }

          if (thumbnailElement) {
            logger.info(`[GalleryContent] Setting thumbnail ${thumbnailId} (index ${index}) to: ${thumbnailSrc}`);
            const imageSrc = thumbnailSrc || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

            // Set image with multiple fallback methods
            let imageSet = false;
            if (thumbnailElement.setProperties) {
              try {
                thumbnailElement.setProperties({ src: imageSrc });
                imageSet = true;
              } catch (e) {
                logger.debug(`[GalleryContent] setProperties failed for ${thumbnailId}: ${e.message}`);
              }
            }
            if (!imageSet && thumbnailElement.src !== undefined) {
              thumbnailElement.src = imageSrc;
              imageSet = true;
            }
            if (!imageSet && thumbnailElement.setAttribute) {
              thumbnailElement.setAttribute("src", imageSrc);
              imageSet = true;
            }

            // Add error handler
            const handleImageError = () => {
              logger.warn(`[GalleryContent] Thumbnail ${thumbnailId} failed to load: ${imageSrc}`);
            };
            if (thumbnailElement.addEventListener) {
              thumbnailElement.addEventListener("error", handleImageError, { once: true });
            }

            // Add click handler for popup
            if (onThumbnailClick) {
              // Remove any existing click handler to prevent duplicates
              if (thumbnailElement.__thumbnailClickHandler) {
                if (thumbnailElement.removeEventListener) {
                  thumbnailElement.removeEventListener("click", thumbnailElement.__thumbnailClickHandler);
                }
              }

              const clickHandler = (event) => {
                logger.info(`[GalleryContent] Thumbnail ${thumbnailId} clicked!`, { event, imageSrc });
                if (event) {
                  if (typeof event.stopPropagation === "function") {
                    event.stopPropagation();
                  }
                  if (typeof event.preventDefault === "function") {
                    event.preventDefault();
                  }
                }
                try {
                  onThumbnailClick(imageSrc);
                } catch (error) {
                  logger.error(`[GalleryContent] Error in thumbnail click handler:`, error);
                }
              };

              // Try multiple ways to attach the click handler
              if (thumbnailElement.addEventListener) {
                thumbnailElement.addEventListener("click", clickHandler, { capture: false });
                thumbnailElement.__thumbnailClickHandler = clickHandler;
                logger.info(`[GalleryContent] ✓ Click handler attached to thumbnail ${thumbnailId} via addEventListener`);
              } else if (thumbnailElement.onclick !== undefined) {
                thumbnailElement.onclick = clickHandler;
                thumbnailElement.__thumbnailClickHandler = clickHandler;
                logger.info(`[GalleryContent] ✓ Click handler attached to thumbnail ${thumbnailId} via onclick`);
              } else {
                logger.warn(`[GalleryContent] ✗ Cannot attach click handler to thumbnail ${thumbnailId} - no event methods available`);
              }

              // Set cursor and pointer-events
              if (thumbnailElement.style) {
                thumbnailElement.style.cursor = "pointer";
                thumbnailElement.style.pointerEvents = "auto";
              }
              if (thumbnailElement.setAttribute) {
                thumbnailElement.setAttribute("style", "cursor: pointer; pointer-events: auto;");
              }
            } else {
              logger.warn(`[GalleryContent] No onThumbnailClick callback provided for thumbnail ${thumbnailId}`);
            }

            if (imageSet) {
              logger.info(`[GalleryContent] ✓ Successfully set thumbnail ${thumbnailId} (${index + 1}/4) to: ${imageSrc}`);
              // Verify the image was actually set
              const actualSrc = thumbnailElement.src || thumbnailElement.getAttribute?.("src");
              if (actualSrc && actualSrc !== imageSrc) {
                logger.warn(`[GalleryContent] Thumbnail ${thumbnailId} src mismatch! Expected: ${imageSrc}, Got: ${actualSrc}`);
              }
            } else {
              logger.error(`[GalleryContent] ✗ Failed to set thumbnail ${thumbnailId} src`);
            }
          } else {
            logger.error(`[GalleryContent] ✗ Thumbnail element ${thumbnailId} NOT FOUND in document for entity ${entity.index}`);
            // Try to log available elements for debugging
            if (document.querySelectorAll) {
              const allImages = document.querySelectorAll("img");
              logger.error(`[GalleryContent] Available img elements: ${allImages.length}`);
              allImages.forEach((img, idx) => {
                logger.error(`[GalleryContent]   img[${idx}]: id="${img.id}", class="${img.className}", src="${img.src || img.getAttribute?.('src') || 'none'}"`);
              });
            }
          }
        });
        
        // Final verification - check all thumbnails were set
        logger.info(`[GalleryContent] Completed binding ${thumbnails.length} thumbnails for entity ${entity.index}`);
      } else {
        logger.warn(`[GalleryContent] No thumbnails array provided for entity ${entity.index}`);
      }

      logger.debug(`[GalleryContent] Gallery content bound for entity ${entity.index}`);

    } catch (error) {
      logger.error(`[GalleryContent] Error binding gallery content for entity ${entity.index}:`, error);
    }
  }

  // Start binding after a delay to ensure PanelUI is initialized
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      attemptBinding(0);
    });
  });
}

