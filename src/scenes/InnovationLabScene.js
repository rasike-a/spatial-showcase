import { PanelUI } from "@iwsdk/core";
import { CAMERA, CONTENT_PANEL } from "../constants/sceneConstants.js";
import { logger } from "../utils/logger.js";
import { BaseScene } from "./BaseScene.js";
import { getShowcaseScene } from "../content/showcaseContent.js";
import { createBackButton } from "../components/BackButton.js";
import { bindPanelButton } from "../utils/panelBindings.js";
import { bindPanelContent } from "../utils/panelContent.js";

/**
 * Innovation Lab scene showcasing technical projects and tools.
 */
export class InnovationLabScene extends BaseScene {
  constructor(world, sceneManager) {
    super(world, sceneManager);
  }

  /**
   * Lifecycle hook invoked by the scene manager to set up entities.
   */
  init() {
    this.setupCamera();

    this.sceneData = getShowcaseScene("innovation_lab");
    if (!this.sceneData) {
      logger.warn("[InnovationLabScene] Missing scene data for innovation_lab");
      return;
    }

    logger.info("InnovationLabScene: Rendering project panels...");
    createBackButton(this.world, this.sceneManager, this.entities);
    this.renderPanels(this.sceneData.panels || []);
    this.renderTeleports(this.sceneData.teleports || []);

    logger.info(`InnovationLabScene: Created ${this.entities.length} entities`);
  }

  renderPanels(panels) {
    const radius = 3.5;
    panels.forEach((panel, index) => {
      const angle = (index / panels.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const entity = this.world.createTransformEntity().addComponent(PanelUI, {
        config: "/ui/projectPanel.json",
        maxWidth: 1.8,
        maxHeight: 2.2
      });

      entity.object3D.position.set(x, CAMERA.DEFAULT_HEIGHT, z);
      entity.object3D.lookAt(
        CAMERA.DEFAULT_POSITION.x,
        CAMERA.DEFAULT_POSITION.y,
        CAMERA.DEFAULT_POSITION.z
      );

      this.trackEntity(entity);

      // Bind panel content
      bindPanelContent(entity, {
        title: panel.title,
        description: panel.description || "",
        image: panel.image || ""
      });
    });
  }

  renderTeleports(teleports) {
    const spacing = 1.6;
    const offsetStart = teleports.length > 1 ? -((teleports.length - 1) * spacing) / 2 : 0;
    teleports.forEach((teleport, index) => {
      const xOffset = offsetStart + index * spacing;
      this.createPortal(teleport.label, xOffset, teleport.target);
    });
  }

  createPortal(label, xOffset, targetSceneId) {
    logger.debug(`Creating portal: ${label} at x=${xOffset}`);

    const entity = this.world.createTransformEntity().addComponent(PanelUI, {
      config: "/ui/portalPanel.json",
      maxWidth: 1.1,
      maxHeight: 0.45
    });

    entity.object3D.position.set(xOffset, 1.4, 2);
    entity.object3D.lookAt(
      CAMERA.DEFAULT_POSITION.x,
      CAMERA.DEFAULT_POSITION.y,
      CAMERA.DEFAULT_POSITION.z
    );

    this.trackEntity(entity);
    bindPanelButton(entity, {
      label,
      onClick: () => this.navigateToScene(targetSceneId)
    });
  }
}

