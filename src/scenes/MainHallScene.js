import { PanelUI } from "@iwsdk/core";
import { bindPanelButton } from "../utils/panelBindings.js";
import { bindPanelContent } from "../utils/panelContent.js";
import { CAMERA, PORTAL } from "../constants/sceneConstants.js";
import { logger } from "../utils/logger.js";
import { BaseScene } from "./BaseScene.js";
import { getShowcaseScene } from "../content/showcaseContent.js";

/**
 * Main hall scene that acts as the navigation hub for all other scenes.
 */
export class MainHallScene extends BaseScene {
  constructor(world, sceneManager) {
    super(world, sceneManager);
  }

  /**
   * Lifecycle hook invoked by the scene manager to set up entities.
   */
  init() {
    // Set camera position on entering scene
    this.setupCamera();

    this.sceneData = getShowcaseScene("main_hall");
    if (!this.sceneData) {
      logger.warn("[MainHallScene] Missing scene data for main_hall");
      return;
    }

    logger.info("MainHallScene: Rendering panels and teleports from content...");
    this.renderPanels(this.sceneData.panels || []);
    this.renderTeleports(this.sceneData.teleports || []);

    logger.info(`MainHallScene: Created ${this.entities.length} entities`);
  }

  renderPanels(panels) {
    // Skip all panels for now
    logger.info("[MainHallScene] Skipped panel rendering to avoid overlaps");
  }

  renderTeleports(teleports) {
    // Show only ONE navigation button to test
    if (teleports && teleports.length > 0) {
      const firstTeleport = teleports[0]; // Just the first one
      this.createPortal(firstTeleport.label, 0, firstTeleport.target);
      logger.info(`[MainHallScene] Created single portal: ${firstTeleport.label}`);
    } else {
      // Fallback: create a test button
      this.createPortal("Gallery", 0, "gallery");
      logger.info("[MainHallScene] Created fallback Gallery portal");
    }
  }

  /**
   * Creates a single portal button that loads the specified scene.
   * @param {string} label - Text displayed on the portal UI
   * @param {number} xOffset - Horizontal placement of the portal
   * @param {string} targetSceneName - Key of the target scene to load
   */
  createPortal(label, xOffset, targetSceneName) {
    logger.info(`[MainHallScene] Creating portal: ${label} at x=${xOffset}`);

    const entity = this.world.createTransformEntity().addComponent(PanelUI, {
      config: "/ui/portalPanel.json",
      maxWidth: 1.2,
      maxHeight: 0.5
    });

    entity.object3D.position.set(xOffset, 1.5, -1.5);
    entity.object3D.lookAt(0, 1.6, 0);

    this.trackEntity(entity);
    
    // Simple button binding
    bindPanelButton(entity, {
      label,
      onClick: () => {
        logger.info(`[MainHallScene] Portal clicked: ${label} -> ${targetSceneName}`);
        this.navigateToScene(targetSceneName);
      }
    });
    
    logger.info(`[MainHallScene] Portal "${label}" created successfully`);
  }
}
