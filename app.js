// Create the application
// Task 2: The game should be 800x600 px in size, it is not necessary to handle resizing
const Application = PIXI.Application;
const app = new Application({
  width: 800,
  height: 600,
  transparent: false,
  antialias: true
});
document.body.appendChild(app.view);

// Some constants which should be reachable at all times
const playerSpeed = 5;
const explosionAnimationTextures = [];
let playerShipSprite;
let keys = [];
let rockets = [];
let enemies = [];
let enemySpawnInterval;
let isGameOver = true;
let scoreCounter = 0;
let scoreText;
let enemyMovementInterval;
let enemiesGoUp = false;

// For easier removal of elements, create a view container which holds
// all the elements from the current screen
const viewContainer = new PIXI.Container();

// Load the data for later use
const loader = PIXI.Loader.shared;
loader
  .add('exitStrategy', './assets/mainMenu/exitSpritesheet.json')
  .add('playerExhaust', './assets/gameplay/playerShipExhaust.json')
  .add('fireAnimation', './assets/gameplay/fireAnimation.json')
  .add('enemyExhaust', './assets/gameplay/enemyExhaust.json')
  .add('explosion', './assets/gameplay/explosion.json')
  .load();

// Create the background since it can be used for every screen as a default background
const backgroundTexture = PIXI.Texture.from('./assets/background/background.png');
const backgroundSprite = new PIXI.TilingSprite(backgroundTexture, app.screen.width, app.screen.height);
app.stage.addChild(backgroundSprite);

// Logo will be reused so makes sense to only load the texture once
const logoTexture = PIXI.Texture.from('./assets/splashScreen/playngo.png');

// Start the the game
createSplashScreen();

// Task 3: At the start, a Splash screen is shown for 2 seconds, then fades out and the
// game continues to the main screen
function createSplashScreen() {
  const container = new PIXI.Container();
  container.position.set(app.screen.width / 2, app.screen.height / 2);

  // Add a bunch of light sprites
  const light2 = PIXI.Sprite.from('./assets/splashScreen/light_rotate_2.png');
  light2.anchor.set(0.5);
  const light1 = PIXI.Sprite.from('./assets/splashScreen/light_rotate_1.png');
  light1.anchor.set(0.5);

  // Add the logo sprite using the preloaded texture
  const logo = new PIXI.Sprite(logoTexture);
  logo.anchor.set(0.5);

  container.addChild(light2, light1, logo);

  viewContainer.addChild(container);

  app.stage.addChild(viewContainer);

  let count = 0;
  app.ticker.add(() => {
    light1.rotation += 0.02;
    light2.rotation += 0.01;

    logo.scale.x = 0.7 + Math.sin(count) * 0.04;
    logo.scale.y = 0.7 + Math.cos(count) * 0.04;

    count += 0.1;
  });

  // Fade out after 2 seconds
  setTimeout(function () {
    fadeOutAndShowMainMenu(container);
  }, 2000);

  // Add the fade out animation and show the main menu
  function fadeOutAndShowMainMenu(element) {
    let splashScreenDone = false;

    app.ticker.add(() => {
      if (element.alpha > 0) {
        element.alpha -= 0.01;
      } else if (element.alpha <= 0) {
        if (!splashScreenDone) {
          splashScreenDone = true;
          app.stage.removeChild(element);
          showMainMenu();
        }
      }
    });
  }
}

// Task 4.2: 4 buttons placed in the middle, from top to bottom (GAME1, GAME2, GAME3 and EXIT)
// Task 4.5: a logo above the buttons
function showMainMenu() {
  createAnimation();
  const textureButton = PIXI.Texture.from('./assets/buttons/mediumButton.png');
  const buttonsContainer = new PIXI.Container();
  // Show logo on top
  const logo = new PIXI.Sprite(logoTexture);
  logo.anchor.set(0.5);
  logo.position.set(400, 150);

  buttonsContainer.addChild(logo);

  const buttons = [];
  const buttonPositions = [
    400, 300,
    400, 375,
    400, 450,
    400, 525
  ];

  // Create the 4 buttons
  for (let i = 0; i < 4; i++) {
    const button = new PIXI.Sprite(textureButton);
    const buttonContainer = new PIXI.Container();
    const buttonText = i !== 3 ? new PIXI.Text(`GAME${i + 1}`) : new PIXI.Text('EXIT');

    button.anchor.set(0.5);
    button.alpha = 0.7;
    button.name = i !== 3 ? 'gameButton' : 'exitButton';
    button.x = buttonPositions[i * 2];
    button.y = buttonPositions[i * 2 + 1];

    buttonText.anchor.set(0.5);
    buttonText.x = buttonPositions[i * 2];
    buttonText.y = buttonPositions[i * 2 + 1];

    // Make the button interactive
    button.interactive = true;
    button.buttonMode = true;

    button
      // Mouse & touch events are normalized into
      // the pointer* events for handling different
      // button events.
      .on('pointerdown', onButtonDown)
      .on('pointerup', onButtonUp)
      .on('pointerover', onButtonOver)
      .on('pointerout', onButtonOut);

    // Add it to the stage
    buttonContainer.addChild(button, buttonText);
    buttonsContainer.addChild(buttonContainer);

    // Add button to array
    buttons.push(button);
  }

  viewContainer.addChild(buttonsContainer);

  app.stage.addChild(viewContainer);
}

// Task 4.3: clicking the EXIT button navigates somewhere
function exitStrategy() {
  // Load the animation to display
  const exitStrategyTextures = [];
  for (let i = 0; i < 100; i++) {
    const exitStrategyTexture = PIXI.Texture.from(`tile${i}.png`);
    exitStrategyTextures.push(exitStrategyTexture);
  }

  //Create the animation
  const animatedExitStrategy = new PIXI.AnimatedSprite(exitStrategyTextures);
  animatedExitStrategy.position.set(400, 435);
  animatedExitStrategy.anchor.set(0.5);
  animatedExitStrategy.scale.set(0.7, 0.7);

  animatedExitStrategy.animationSpeed = 0.4;
  animatedExitStrategy.play();

  viewContainer.addChild(animatedExitStrategy);

  app.stage.addChild(viewContainer);
}

// Task 4.4: clicking any of the GAME buttons takes the user to the game
// Task: 5.1: the player’s spaceship can move around the game area
function startGame() {
  // Change global variable for game start
  isGameOver = false;
  // First modify/create the player's ship
  playerShipSprite = new PIXI.Sprite.from('./assets/gameplay/playerShip.png');
  playerShipSprite.anchor.set(0.5);
  playerShipSprite.position.set(60, app.screen.height / 2);

  // Load the animation for the movement
  const exhaustAnimationTextures = [];
  for (let i = 1; i < 5; i++) {
    const exhaustAnimation = PIXI.Texture.from(`exhaust${i}.png`);
    exhaustAnimationTextures.push(exhaustAnimation);
  }

  // Create the animation
  const animatedExhaust = new PIXI.AnimatedSprite(exhaustAnimationTextures);
  animatedExhaust.anchor.set(0.5);
  animatedExhaust.position.set(-55, 0);
  animatedExhaust.animationSpeed = 0.1;
  animatedExhaust.play();

  // Load the animation for the explosion (if it was not loaded before)
  if (explosionAnimationTextures.length === 0) {
    for (let i = 1; i < 10; i++) {
      const explosionAnimation = PIXI.Texture.from(`Explosion${i}.png`);
      explosionAnimationTextures.push(explosionAnimation);
    }
  }

  // We need to move the ship and the exhaust together
  playerShipSprite.addChild(animatedExhaust);

  // Call the game controlling functions
  createMovement();
  spawnEnemy();
  showScore();
  startBackgroundTiling(true);

  viewContainer.addChild(playerShipSprite);

  app.stage.addChild(viewContainer);
}

// Task 5.1: the player’s spaceship can move around the game area
function createMovement() {
  // Keyboard event handlers
  document.addEventListener('keydown', keysDown);
  document.addEventListener('keyup', keysUp);

  app.ticker.add(gameLoop);
}

function gameLoop() {
  // Some if statements as well just to make sure that the ship stays in the view
  // Only move when the game is not over
  if (!isGameOver) {
    // W && ArrowUp
    if (keys['38'] || keys['87']) {
      if (playerShipSprite.y > playerShipSprite.height / 4) {
        playerShipSprite.y -= playerSpeed;
      }
    }

    // S && ArrowDown
    if (keys['40'] || keys['83']) {
      if (playerShipSprite.y < (600 - playerShipSprite.height / 4)) {
        playerShipSprite.y += playerSpeed;
      }
    }

    // A && ArrowLeft
    if (keys['37'] || keys['65']) {
      if (playerShipSprite.x > playerShipSprite.width / 2) {
        playerShipSprite.x -= playerSpeed;
      }
    }

    // D && ArrowRight
    if (keys['39'] || keys['68']) {
      if (playerShipSprite.x < (800 - playerShipSprite.width / 2)) {
        playerShipSprite.x += playerSpeed;
      }
    }

    // Rocket movement
    for (let i = 0; i < rockets.length; i++) {
      rockets[i].position.x += rockets[i].speed;

      if (rockets[i].position.x > 800) {
        rockets[i].dead = true;
      }
    }

    // Rocket deletion if out of screen
    for (let i = 0; i < rockets.length; i++) {
      if (rockets[i].dead) {
        viewContainer.removeChild(rockets[i]);
        rockets.splice(i, 1);
      };
    }

    // Enemy ship movement
    for (let i = 0; i < enemies.length; i++) {
      // If there is a collision stop moving and render explosion
      if (didCollide(playerShipSprite, enemies[i], true)) {
        isGameOver = true;
        explode(playerShipSprite, true);
      } else {
        enemies[i].position.x -= enemies[i].speed;
        if (enemiesGoUp && (enemies[i].position.y >= (0 + enemies[i].height / 2))) {
          enemies[i].position.y -= (enemies[i].speed / 2);
        } else if (!enemiesGoUp && (enemies[i].position.y <= (600 - enemies[i].height / 2))) {
          enemies[i].position.y += (enemies[i].speed / 2);
        }
      }
    }

    // Collison detection for the rockets
    for (let i = 0; i < rockets.length; i++) {
      for (let j = 0; j < enemies.length; j++) {
        if (didCollide(rockets[i], enemies[j])) {
          // Index of given element can change if some other element
          // triggers this first, so first save it into a constant
          const enemyToExplode = enemies[j];
          const rocketToExplode = rockets[i];

          // Remove the destroyed elements
          viewContainer.removeChild(enemyToExplode);
          viewContainer.removeChild(rocketToExplode);

          // Play animation and update score
          explode(enemyToExplode, false);
          scoreCounter += 15;
          updateScore();

          // Remove the destroyed elements from the holding arrays
          rockets.splice(rockets.indexOf(rocketToExplode), 1);
          enemies.splice(enemies.indexOf(enemyToExplode), 1);
        }
      }
    }
  }
}

// Task 5.3: the background moves from right to left, with a parallax scrolling effect
function startBackgroundTiling(start) {
  if (start) {
    app.ticker.add(backgroundMovement);
  } else {
    app.ticker.remove(backgroundMovement);
  }
}

// Created as a separate function so it can be removed from the ticker
function backgroundMovement() {
  backgroundSprite.tilePosition.x -= 1;
}

// Task 5.2: it can shoot rockets
function fireRocket() {
  // Load the fire animation
  const shotAnimationTextures = [];
  for (let i = 1; i < 4; i++) {
    const shotAnimationTexture = PIXI.Texture.from(`shotAnimation${i}.png`);
    shotAnimationTextures.push(shotAnimationTexture);
  }

  // Create the animation
  const shotAnimation = new PIXI.AnimatedSprite(shotAnimationTextures);
  shotAnimation.position.set(playerShipSprite.width / 2, 5);
  shotAnimation.anchor.set(0.5);
  shotAnimation.scale.set(0.7, 0.7);

  playerShipSprite.addChild(shotAnimation);

  shotAnimation.animationSpeed = 0.4;
  shotAnimation.loop = false;

  // When done call the createRocket method to display the projectile
  shotAnimation.onComplete = function () {
    playerShipSprite.removeChild(shotAnimation);
    createRocket();
  };

  shotAnimation.play();
}

// Create the rocket sprite which has to be displayed
function createRocket() {
  const rocket = new PIXI.Sprite.from('./assets/gameplay/rocket.png');

  rocket.anchor.set(0.5);
  rocket.scale.set(0.5, 0.5);
  rocket.x = playerShipSprite.x + playerShipSprite.width / 2;
  rocket.y = playerShipSprite.y + 5;
  rocket.speed = 5;

  viewContainer.addChild(rocket);

  rockets.push(rocket);
}

// Task 5.4: every 2 seconds, an enemy spaceship arrives
// Task 5.5: the enemy spaceships move in some randomized way
function spawnEnemy() {
  // Load the textures once, loading them seperately would not make any sense
  const enemyTexture = new PIXI.Texture.from('./assets/gameplay/enemyShip.png');
  const enemyExhaustTextures = [];

  for (let i = 1; i < 5; i++) {
    const exhaustAnimation = PIXI.Texture.from(`enemyExhaust${i}.png`);
    enemyExhaustTextures.push(exhaustAnimation);
  }

  // Interval function to create enemies every 2 seconds
  enemySpawnInterval = window.setInterval(function () {
    createEnemy(enemyTexture, enemyExhaustTextures);
  }, 2000);

  // Interval function change the direction of enemies randomly
  enemyMovementInterval = window.setInterval(function () {
    enemiesGoUp = Math.random() < 0.5;
  }, 1000);
}

// Create the enemy ship to display
function createEnemy(texture, animationTexture) {
  const enemySprite = new PIXI.Sprite.from(texture);
  enemySprite.anchor.set(0.5);
  enemySprite.scale.set(0.75, 0.75);

  // Enemy should not be outside of the view so some calculations have to be made
  enemySprite.position.set(850, calculateEnemyPosition(enemySprite));
  enemySprite.speed = 2;

  //load the animation
  const animatedExhaust = new PIXI.AnimatedSprite(animationTexture);
  animatedExhaust.anchor.set(0.5);
  animatedExhaust.position.set(65, 0);
  animatedExhaust.animationSpeed = 0.1;
  animatedExhaust.play();

  enemySprite.addChild(animatedExhaust);
  enemies.push(enemySprite);

  viewContainer.addChild(enemySprite);
}

// Function to randomly spawn enemies
function calculateEnemyPosition(sprite) {
  // Calculate value for enemy position, max height value is fine
  // we only have to check for the minimum value
  let randomValue = Math.floor(Math.random() * (600 - sprite.height / 2));

  if (randomValue < 0 + sprite.height / 2) {
    randomValue = 0 + sprite.height / 2;
  }
  return randomValue;
}

// Clean up method when game stops
function gameOver() {
  // Remove elements which are not needed
  clearScreen();
  // Remove enemy spawning interval function
  clearInterval(enemySpawnInterval);
  clearInterval(enemyMovementInterval);
  // Show main menu again
  showMainMenu();
  // Remove gameLoop method from the ticker
  app.ticker.remove(gameLoop);
  // Remove event listeners
  document.removeEventListener('keydown', keysDown);
  document.removeEventListener('keyup', keysUp);
  // Stop background tiling
  startBackgroundTiling(false);
  // Reset global variables
  keys = [];
  rockets = [];
  enemies = [];
  scoreCounter = 0;
  playerShipSprite.destroy();
  scoreText.destroy();
}

// Task 4.1: background with some animation to make the view more interesting
function createAnimation() {
  // Get the texture for rope.
  const starTexture = PIXI.Texture.from('./assets/mainMenu/star.png');

  const starAmount = 1000;
  let cameraZ = 0;
  const fov = 20;
  const baseSpeed = 0.025;
  let speed = 0;
  let warpSpeed = 0;
  const starStretch = 5;
  const starBaseSize = 0.05;


  // Create the stars
  const stars = [];
  for (let i = 0; i < starAmount; i++) {
    const star = {
      sprite: new PIXI.Sprite(starTexture),
      z: 0,
      x: 0,
      y: 0,
    };
    star.sprite.anchor.x = 0.5;
    star.sprite.anchor.y = 0.7;
    randomizeStar(star, true);
    viewContainer.addChild(star.sprite);
    stars.push(star);
  }

  function randomizeStar(star, initial) {
    star.z = initial ? Math.random() * 2000 : cameraZ + Math.random() * 1000 + 2000;

    // Calculate star positions with radial random coordinate so no star hits the camera.
    const deg = Math.random() * Math.PI * 2;
    const distance = Math.random() * 50 + 1;
    star.x = Math.cos(deg) * distance;
    star.y = Math.sin(deg) * distance;
  }

  // Change flight speed every 5 seconds
  setInterval(() => {
    warpSpeed = warpSpeed > 0 ? 0 : 1;
  }, 5000);

  // Listen for animate update
  app.ticker.add((delta) => {
    // Simple easing. This should be changed to proper easing function when used for real.
    speed += (warpSpeed - speed) / 20;
    cameraZ += delta * 10 * (speed + baseSpeed);
    for (let i = 0; i < starAmount; i++) {
      const star = stars[i];
      if (star.z < cameraZ) randomizeStar(star);

      // Map star 3d position to 2d with really simple projection
      const z = star.z - cameraZ;
      star.sprite.x = star.x * (fov / z) * app.renderer.screen.width + app.renderer.screen.width / 2;
      star.sprite.y = star.y * (fov / z) * app.renderer.screen.width + app.renderer.screen.height / 2;

      // Calculate star scale & rotation.
      const dxCenter = star.sprite.x - app.renderer.screen.width / 2;
      const dyCenter = star.sprite.y - app.renderer.screen.height / 2;
      const distanceCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
      const distanceScale = Math.max(0, (2000 - z) / 2000);
      star.sprite.scale.x = distanceScale * starBaseSize;
      // Star is looking towards center so that y axis is towards center.
      // Scale the star depending on how fast we are moving, what the stretchfactor is and depending on how far away it is from the center.
      star.sprite.scale.y = distanceScale * starBaseSize + distanceScale * speed * starStretch * distanceCenter / app.renderer.screen.width;
      star.sprite.rotation = Math.atan2(dyCenter, dxCenter) + Math.PI / 2;
    }
  });

}

// Show styled score text
function showScore() {
  const style = new PIXI.TextStyle({
    fontFamily: 'Verdana',
    fontSize: 36,
    fontStyle: 'italic',
    fontWeight: 'bold',
    stroke: '#2185c7',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440,
    lineJoin: 'round',
  });

  scoreText = new PIXI.Text(`Score: ${scoreCounter}`, style);
  scoreText.x = 30;
  scoreText.y = 20;

  viewContainer.addChild(scoreText);
}

// Update score text
function updateScore() {
  scoreText.text = `Score: ${scoreCounter}`;
}

// Helper functions

// Clear the screen contents
function clearScreen() {
  viewContainer.removeChildren();
  app.stage.removeChild(viewContainer);
}

// Create back button
function createBackButton() {
  const buttonsContainer = new PIXI.Container();
  const textureButton = PIXI.Texture.from('./assets/buttons/backButton.png');

  const button = new PIXI.Sprite(textureButton);
  const buttonContainer = new PIXI.Container();
  const buttonText = new PIXI.Text('« Back');

  button.anchor.set(0.5);
  button.name = 'backButton';
  button.alpha = 0.7;
  button.position.set(60, 40);

  buttonText.anchor.set(0.5);
  buttonText.position.set(60, 40);

  // make the button interactive
  button.interactive = true;
  button.buttonMode = true;

  button
    // Mouse & touch events are normalized into
    // the pointer* events for handling different
    // button events.
    .on('pointerdown', onButtonDown)
    .on('pointerup', onButtonUp)
    .on('pointerover', onButtonOver)
    .on('pointerout', onButtonOut);

  // add it to the stage
  buttonContainer.addChild(button, buttonText);
  buttonsContainer.addChild(buttonContainer);

  viewContainer.addChild(buttonsContainer);
  app.stage.addChild(viewContainer);
}

// Method for storing key codes and if they are pressed
function keysDown(e) {
  keys[e.keyCode] = true;
  // Special use case for firing
  if (e.code === 'Space') {
    fireRocket();
  }
}

// Method for checking if key is no longer pressed
function keysUp(e) {
  keys[e.keyCode] = false;
}

// Task 5.6: if the projectile of the player's spaceship hits an enemy, its spaceship blows up and
// disappears, emitting particles
// Task 5.7: if the player's spaceship collides with an enemy object, it blows up, and the game
// ends, going back to the main menu
function didCollide(object1, object2, playerCollision) {
  if (object1 !== undefined && object2 !== undefined) {
    let bounds1 = object1.getBounds();
    let bounds2 = object2.getBounds();

    // Since the player's and the enemy's bound is greater than the actual bounds
    // which should be checked, we have to make some adjustments
    // Custom hitboxes would be nice but since not enough time, some "hacky" solution
    // This should never be used in a proper production code
    if (playerCollision) {
      bounds1.width = object1.width * 0.75;
      bounds1.height = object1.height / 2;
      bounds2.width = object2.width * 0.75;
      bounds2.height = object2.height / 2;

      bounds1.y += Math.floor(object1.height / 2);
      bounds2.y += Math.floor(object2.height / 2);
    } else {
      bounds2.height = object2.width * 0.75;
      bounds2.y += Math.floor(object2.height / 4);
    }

    return bounds1.x < bounds2.x + bounds2.width
      && bounds1.x + bounds1.width > bounds2.x
      && bounds1.y < bounds2.y + bounds2.height
      && bounds1.y + bounds1.height > bounds2.y;
  }
}

// Used in Task 5.6 and 5.7 as well
function explode(element, isGameOver) {
  if (element) {
    const animatedExplosion = new PIXI.AnimatedSprite(explosionAnimationTextures);
    animatedExplosion.anchor.set(0.5);
    animatedExplosion.animationSpeed = 0.4;
    animatedExplosion.position.set(element.x, element.y);
    animatedExplosion.loop = false;

    // Bigger explosion if player dies
    if (isGameOver) {
      animatedExplosion.scale.set(2, 2);
    }

    animatedExplosion.onComplete = function () {
      viewContainer.removeChild(animatedExplosion);
      animatedExplosion.destroy();

      if (isGameOver) {
        gameOver();
      }
    };

    viewContainer.addChild(animatedExplosion);
    animatedExplosion.play();
  }
}

// Reusable button methods

function onButtonDown() {
  this.isdown = true;
  this.scale.set(1.05, 1.05);
  this.alpha = 1;
}

// Used for the task 4.4 and 4.3
function onButtonUp() {
  this.isdown = false;
  if (this.isOver) {
    this.scale.set(1, 1);
    this.alpha = 0.7;

    clearScreen();

    if (this.name === 'exitButton') {
      exitStrategy();
      createBackButton();
    } else if (this.name === 'backButton') {
      showMainMenu();
    } else if (this.name === 'gameButton') {
      startGame();
    }
  }
}

function onButtonOver() {
  this.isOver = true;
  if (this.isdown) {
    return;
  }
  this.alpha = 1;
}

function onButtonOut() {
  this.isOver = false;
  if (this.isdown) {
    return;
  }
  this.alpha = 0.7;
}