import { PanelUI, PanelDocument } from "@iwsdk/core";
import { CAMERA } from "../constants/sceneConstants.js";
import { logger } from "../utils/logger.js";
import { BaseScene } from "./BaseScene.js";
import { getShowcaseScene } from "../content/showcaseContent.js";
import { createBackButton } from "../components/BackButton.js";
import { bindPanelButton } from "../utils/panelBindings.js";
import { bindGalleryContent } from "../utils/galleryContent.js";

/**
 * Gallery scene showcasing AI art and photography collections.
 */
export class GalleryScene extends BaseScene {
  constructor(world, sceneManager) {
    super(world, sceneManager);
    this.popupEntity = null; // Track the popup entity
  }

  /**
   * Lifecycle hook invoked by the scene manager to set up entities.
   */
  init() {
    this.setupCamera();

    this.sceneData = getShowcaseScene("gallery");
    if (!this.sceneData) {
      logger.warn("[GalleryScene] Missing scene data for gallery");
      return;
    }

    logger.info("GalleryScene: Rendering gallery content...");

    // Render panels on both sides (like Main Hall)
    this.renderPanels(this.sceneData.panels || []);

    // Add back button in the middle
    createBackButton(this.world, this.sceneManager, this.entities);

    // Render forward navigation teleports (if any)
    this.renderTeleports(this.sceneData.teleports || []);

    logger.info(`GalleryScene: Created ${this.entities.length} entities`);
  }

  /**
   * Override dispose to clean up popup before base disposal.
   */
  dispose() {
    // Hide popup before disposing scene
    this.hideImagePopup();
    // Call parent dispose
    super.dispose();
  }

  renderPanels(panels) {
    logger.info(`[GalleryScene] Starting to render ${panels.length} panels`);
    logger.info(`[GalleryScene] Panel data:`, JSON.stringify(panels, null, 2));

    if (!panels || panels.length === 0) {
      logger.warn("[GalleryScene] No panels to render!");
      return;
    }

    // Limit to 2 panels for side-by-side layout (like Main Hall)
    const displayPanels = panels.slice(0, 2);
    logger.info(`[GalleryScene] Displaying ${displayPanels.length} panels`);

    displayPanels.forEach((panel, index) => {
      logger.info(`[GalleryScene] Rendering panel ${index}: ${panel.title}`, panel);

      try {
        const entity = this.world.createTransformEntity().addComponent(PanelUI, {
          config: "/ui/galleryPanel.json",
          maxWidth: 1.6, // Further reduced to minimize extra space
          maxHeight: 2.5 // Smaller to fit screen better
        });

        logger.info(`[GalleryScene] Panel entity created successfully with index: ${entity.index}`);

        // Position panels side by side in front of user (adjusted spacing to fit visible area)
        const spacing = 1.9; // Adjusted spacing for smaller panels (1.6 width) to fit visible area
        const offsetStart = displayPanels.length > 1 ? -((displayPanels.length - 1) * spacing) / 2 : 0;
        const xOffset = offsetStart + index * spacing;

        entity.object3D.position.set(xOffset, 1.6, -3.0);
        entity.object3D.lookAt(0, 1.6, 0);

        logger.info(`[GalleryScene] Panel ${index} positioned at (${xOffset}, 1.6, -3.0)`);

        this.trackEntity(entity);

      // Delay content binding to ensure PanelUI is fully initialized
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Bind gallery content with 4 thumbnails
          const thumbnails = panel.thumbnails || panel.images || [];
          logger.info(`[GalleryScene] Panel ${index} thumbnails:`, thumbnails);
          
          // If single image provided, use it for all 4 thumbnails (or create variations)
          const thumbnailList = thumbnails.length >= 4
            ? thumbnails.slice(0, 4)
            : thumbnails.length > 0
              ? [...thumbnails, ...Array(4 - thumbnails.length).fill(thumbnails[0])]
              : panel.image
                ? [panel.image, panel.image, panel.image, panel.image]
                : [];

          logger.info(`[GalleryScene] Binding content for panel ${index}:`, {
            title: panel.title,
            description: panel.description,
            thumbnailCount: thumbnailList.length
          });

          bindGalleryContent(
            entity,
            {
              title: panel.title,
              description: panel.description || "",
              thumbnails: thumbnailList
            },
            (imageSrc) => {
              // Callback when thumbnail is clicked - show popup
              this.showImagePopup(imageSrc);
            }
          );
        });
      });

        logger.info(`[GalleryScene] Panel ${index} created at position (${xOffset}, 1.6, -3.0)`);
      } catch (error) {
        logger.error(`[GalleryScene] Error creating panel ${index}:`, error);
      }
    });

    logger.info(`[GalleryScene] Created ${displayPanels.length} gallery panels`);
  }

  renderTeleports(teleports) {
    // Filter out "Main Hall" teleport since we have back button
    const forwardTeleports = teleports.filter((t) => t.target !== "main_hall");

    if (forwardTeleports.length === 0) {
      logger.info("[GalleryScene] No forward teleports to render");
      return;
    }

    logger.info(`[GalleryScene] Rendering ${forwardTeleports.length} forward teleports`);

    // Position teleports below panels
    const spacing = 1.8;
    const offsetStart =
      forwardTeleports.length > 1 ? -((forwardTeleports.length - 1) * spacing) / 2 : 0;

    forwardTeleports.forEach((teleport, index) => {
      const xOffset = offsetStart + index * spacing;
      this.createPortal(teleport.label, xOffset, teleport.target);
    });

    logger.info(`[GalleryScene] Created ${forwardTeleports.length} forward navigation portals`);
  }

  createPortal(label, xOffset, targetSceneId) {
    logger.info(`[GalleryScene] Creating portal: ${label} at x=${xOffset}`);

    const entity = this.world.createTransformEntity().addComponent(PanelUI, {
      config: "/ui/portalPanel.json",
      maxWidth: 1.2,
      maxHeight: 0.5
    });

    entity.object3D.position.set(xOffset, 0.8, -2.5);
    entity.object3D.lookAt(0, 1.6, 0);

    this.trackEntity(entity);

    bindPanelButton(entity, {
      label,
      onClick: () => {
        logger.info(`[GalleryScene] Portal clicked: ${label} -> ${targetSceneId}`);
        this.navigateToScene(targetSceneId);
      }
    });

    logger.info(`[GalleryScene] Portal "${label}" created successfully`);
  }

  /**
   * Shows a popup with a full-size image when a thumbnail is clicked.
   * @param {string} imageSrc - Source URL of the image to display
   */
  showImagePopup(imageSrc) {
    logger.info(`[GalleryScene] Showing image popup for: ${imageSrc}`);

    // Hide existing popup if any
    if (this.popupEntity) {
      this.hideImagePopup();
    }

    // Create popup entity - size matched to content
    const popupEntity = this.world.createTransformEntity().addComponent(PanelUI, {
      config: "/ui/imagePopup.json",
      maxWidth: 1.8, // Matched to content width (10 + padding)
      maxHeight: 2.0 // Matched to content height (7 image + header + padding)
    });

    logger.info(`[GalleryScene] Popup entity created with index: ${popupEntity.index}`);

    // Position popup centered in front of user
    popupEntity.object3D.position.set(0, 1.5, -1.8);
    popupEntity.object3D.lookAt(0, 1.6, 0);

    logger.info(`[GalleryScene] Popup positioned at: (0, 1.5, -1.8)`);

    this.trackEntity(popupEntity);
    this.popupEntity = popupEntity;

    // Bind popup content after a delay to ensure PanelUI is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.bindPopupContent(popupEntity, imageSrc);
      });
    });

    logger.info(`[GalleryScene] Image popup created for: ${imageSrc}`);
  }

  /**
   * Binds content to the popup (image and close button).
   * @param {Entity} popupEntity - The popup entity
   * @param {string} imageSrc - Source URL of the image
   */
  bindPopupContent(popupEntity, imageSrc) {
    const scene = this; // Capture 'this' for use in nested function

    function attemptBinding(attempt = 0) {
      try {
        if (popupEntity.index === undefined || popupEntity.index === null) {
          if (attempt < 200) {
            requestAnimationFrame(() => attemptBinding(attempt + 1));
          } else {
            logger.warn("[GalleryScene] Popup entity index not available");
          }
          return;
        }

        const document = PanelDocument.data.document[popupEntity.index];
        if (!document) {
          if (attempt < 200) {
            requestAnimationFrame(() => attemptBinding(attempt + 1));
          } else {
            logger.warn("[GalleryScene] Popup document not ready");
          }
          return;
        }

        // Set popup image
        let imageElement = document.getElementById?.("popup-image");
        if (!imageElement && document.querySelector) {
          imageElement = document.querySelector("#popup-image");
        }

        if (imageElement) {
          let imageSet = false;
          if (imageElement.setProperties) {
            try {
              imageElement.setProperties({ src: imageSrc });
              imageSet = true;
            } catch (e) {
              logger.debug(`[GalleryScene] setProperties failed: ${e.message}`);
            }
          }
          if (!imageSet && imageElement.src !== undefined) {
            imageElement.src = imageSrc;
            imageSet = true;
          }
          if (!imageSet && imageElement.setAttribute) {
            imageElement.setAttribute("src", imageSrc);
            imageSet = true;
          }

          if (imageSet) {
            logger.info(`[GalleryScene] Set popup image: ${imageSrc}`);
          }
        }

        // Bind close button
        let closeButton = document.getElementById?.("popup-close-button");
        if (!closeButton && document.querySelector) {
          closeButton = document.querySelector("#popup-close-button");
        }

        if (closeButton) {
          // Remove existing handler if any
          if (closeButton.__closeHandler) {
            closeButton.removeEventListener("click", closeButton.__closeHandler);
          }

          const closeHandler = (event) => {
            if (event) {
              event.stopPropagation();
            }
            logger.info("[GalleryScene] Close button clicked");
            scene.hideImagePopup();
          };

          closeButton.addEventListener("click", closeHandler);
          closeButton.__closeHandler = closeHandler;
          logger.info("[GalleryScene] Close button bound");
        }

        logger.debug("[GalleryScene] Popup content bound successfully");
      } catch (error) {
        logger.error("[GalleryScene] Error binding popup content:", error);
      }
    }

    attemptBinding(0);
  }

  /**
   * Hides and disposes of the image popup.
   */
  hideImagePopup() {
    if (this.popupEntity) {
      logger.info("[GalleryScene] Hiding image popup");

      const popupToRemove = this.popupEntity;
      this.popupEntity = null; // Clear reference first

      // Remove from entities array if it's there
      const index = this.entities.indexOf(popupToRemove);
      if (index > -1) {
        this.entities.splice(index, 1);
      }

      // Dispose of the popup entity
      if (popupToRemove.object3D) {
        if (popupToRemove.object3D.parent) {
          popupToRemove.object3D.parent.remove(popupToRemove.object3D);
        }
        if (this.world?.scene?.remove) {
          try {
            this.world.scene.remove(popupToRemove.object3D);
          } catch (e) {
            logger.debug(`[GalleryScene] Could not remove popup from world scene: ${e.message}`);
          }
        }

        // Dispose Three.js resources
        popupToRemove.object3D.traverse((object) => {
          if (object.isMesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((m) => m.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });

        popupToRemove.object3D = null;
      }

      logger.info("[GalleryScene] Image popup hidden");
    }
  }
}

