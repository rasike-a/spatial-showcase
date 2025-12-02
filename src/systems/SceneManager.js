/**
 * Coordinates scene lifecycle: creation, initialization, and disposal.
 */
export class SceneManager {
  /**
   * @param {import("@iwsdk/core").World} world
   */
  constructor(world) {
    this.world = world;
    this.activeScene = null;
  }

  /**
   * Replaces the current scene with a new one and calls its init hook.
   * @param {typeof import("../scenes/BaseScene.js").BaseScene} SceneClass
   * @param {unknown} data
   */
  loadScene(SceneClass, data = null) {
    const sceneName = SceneClass.name || 'UnknownScene';
    console.log(`[SceneManager] Loading scene: ${sceneName}`);
    
    // Dispose existing scene with enhanced logging
    if (this.activeScene) {
      const oldSceneName = this.activeScene.constructor.name || 'UnknownScene';
      console.log(`[SceneManager] Disposing previous scene: ${oldSceneName}`);
      
      if (this.activeScene.dispose) {
        this.activeScene.dispose();
      }
      
      // Force cleanup - wait a frame for disposal to complete
      this.activeScene = null;
      
      // Wait for next frame to ensure cleanup is complete
      requestAnimationFrame(() => {
        this._createNewScene(SceneClass, data, sceneName);
      });
    } else {
      // No previous scene, create immediately
      this._createNewScene(SceneClass, data, sceneName);
    }
  }
  
  _createNewScene(SceneClass, data, sceneName) {
    console.log(`[SceneManager] Creating new scene: ${sceneName}`);
    
    // Create new scene
    this.activeScene = new SceneClass(this.world, this, data);

    // Initialize scene
    if (this.activeScene.init) {
      this.activeScene.init();
    }
    
    console.log(`[SceneManager] Scene initialized: ${sceneName}`);
  }
}
