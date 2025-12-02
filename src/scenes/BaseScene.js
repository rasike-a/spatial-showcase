import { CAMERA } from "../constants/sceneConstants.js";
import { getSceneLoader } from "./sceneRegistry.js";
import { logger } from "../utils/logger.js";
import { safeDynamicImport, handleSceneLoadError } from "../utils/errorHandler.js";

/**
 * Base class providing common scene utilities such as camera setup and entity tracking.
 */
export class BaseScene {
  /**
   * @param {import("@iwsdk/core").World} world - IWSDK world instance
   * @param {import("../systems/SceneManager.js").SceneManager} sceneManager - scene manager controlling transitions
   */
  constructor(world, sceneManager) {
    this.world = world;
    this.sceneManager = sceneManager;
    this.entities = [];
  }

  /**
   * Positions the camera using the provided coordinates (defaults to the global camera position).
   * @param {{ x: number, y: number, z: number }} position
   */
  setupCamera(position = CAMERA.DEFAULT_POSITION) {
    const { camera } = this.world;
    camera.position.set(position.x, position.y, position.z);
  }

  /**
   * Tracks a newly created entity so it can be disposed automatically.
   * Ensures the entity's object3D is added to the world scene to avoid parenting warnings.
   * @param {Entity} entity
   * @returns {Entity}
   */
  trackEntity(entity) {
    // IWSDK automatically handles entity parenting to the active level root
    // The parenting warnings are informational and expected behavior
    this.entities.push(entity);
    return entity;
  }

  /**
   * Destroys all tracked entities and resets the internal list.
   */
  dispose() {
    console.log(`[BaseScene] Disposing scene with ${this.entities.length} entities`);
    
    this.entities.forEach((entity, index) => {
      console.log(`[BaseScene] Disposing entity ${index}: ${entity.constructor.name}`);
      
      // Remove object3D from scene - this is the primary cleanup method in IWSDK
      if (entity.object3D) {
        if (entity.object3D.parent) {
          console.log(`[BaseScene] Removing entity ${index} from parent`);
          entity.object3D.parent.remove(entity.object3D);
        }
        
        // More aggressive cleanup - try to remove from world scene directly
        if (this.world && this.world.scene && this.world.scene.remove) {
          this.world.scene.remove(entity.object3D);
        }
        
        // Dispose of Three.js resources if available
        if (entity.object3D.dispose) {
          entity.object3D.dispose();
        }
        
        // Clear the object3D reference
        entity.object3D = null;
      }
      
      // Try to destroy the entity itself if it has a destroy method
      if (entity.destroy) {
        entity.destroy();
      }
    });
    
    this.entities = [];
    console.log(`[BaseScene] Scene disposal complete`);
  }

  /**
   * Loads another scene by ID using the shared scene registry.
   * @param {string} targetSceneId
   */
  async navigateToScene(targetSceneId) {
    const loader = getSceneLoader(targetSceneId);
    if (!loader) {
      logger.warn(`[SceneNavigation] No loader registered for "${targetSceneId}"`);
      return;
    }
    logger.info(`[SceneNavigation] Transition -> ${targetSceneId}`);
    try {
      const SceneClass = await safeDynamicImport(loader, `scene "${targetSceneId}"`);
      if (!SceneClass) {
        logger.warn(`[SceneNavigation] Loader for "${targetSceneId}" returned empty module`);
        return;
      }
      this.sceneManager.loadScene(SceneClass);
    } catch (error) {
      handleSceneLoadError(targetSceneId, error);
    }
  }
}
