import { PanelUI } from "@iwsdk/core";
import { CAMERA, CONTENT_PANEL } from "../constants/sceneConstants.js";
import { logger } from "../utils/logger.js";
import { BaseScene } from "./BaseScene.js";
import { getShowcaseScene } from "../content/showcaseContent.js";
import { bindPanelButton } from "../utils/panelBindings.js";
import { bindPanelContent } from "../utils/panelContent.js";

/**
 * Gallery scene showcasing AI art and photography collections.
 */
export class GalleryScene extends BaseScene {
  constructor(world, sceneManager) {
    super(world, sceneManager);
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

    logger.info("GalleryScene: Rendering single element only...");
    
    // Show ONLY ONE element - skip BackButton, skip panels, show only first teleport
    this.renderTeleports(this.sceneData.teleports || []);

    logger.info(`GalleryScene: Created ${this.entities.length} entities`);
  }

  renderPanels(panels) {
    // Skip all panels to avoid overlaps - showing only teleport
    logger.info("[GalleryScene] Skipped panel rendering - teleport only mode");
  }

  renderTeleports(teleports) {
    // Show only one back button
    if (teleports && teleports.length > 0) {
      const backTeleport = teleports[0];
      this.createPortal(backTeleport.label, 0, backTeleport.target);
      logger.info(`[GalleryScene] Created single teleport: ${backTeleport.label}`);
    }
  }

  createPortal(label, xOffset, targetSceneId) {
    logger.info(`[GalleryScene] Creating portal: ${label}`);

    const entity = this.world.createTransformEntity().addComponent(PanelUI, {
      config: "/ui/portalPanel.json",
      maxWidth: 1.2,
      maxHeight: 0.5
    });

    entity.object3D.position.set(0, 1.0, -1.8);
    entity.object3D.lookAt(0, 1.6, 0);

    this.trackEntity(entity);
    
    bindPanelButton(entity, {
      label,
      onClick: () => {
        logger.info(`[GalleryScene] Portal clicked: ${label} -> ${targetSceneId}`);
        this.navigateToScene(targetSceneId);
      }
    });
    
    logger.info(`[GalleryScene] Portal created: ${label}`);
  }
}

