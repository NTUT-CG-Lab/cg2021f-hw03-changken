import * as THREE from './build/three.module.js';
// import { GUI } from './jsm/libs/dat.gui.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { OutlineEffect } from './jsm/effects/OutlineEffect.js';
import { MMDLoader } from './jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from './jsm/animation/MMDAnimationHelper.js';

let scene,
  scenes = [],
  renderer,
  effect;
let mesh,
  meshes = [null, null, null, null],
  helper;
let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
let frustumSize = 30;
let camera, camera2, camera3, camera4, camera5;

let loader;
let modelFile;
let modelLocationFile;
let modelIndex = 0;
let selectedIrisId = 0;
let cameraControlsList = [];
let isInitedList = [false, false, false, false];

Ammo().then(function (AmmoLib) {
  Ammo = AmmoLib;

  init();
  animate();
});

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  camera = new THREE.OrthographicCamera(
    (0.5 * frustumSize * aspect) / -2,
    (0.5 * frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.1,
    1000
  );
  camera2 = new THREE.OrthographicCamera(
    (0.25 * frustumSize * aspect) / -2,
    (0.25 * frustumSize * aspect) / 2,
    (0.5 * frustumSize) / 2,
    (0.5 * frustumSize) / -2,
    0.1,
    1000
  );
  camera3 = new THREE.OrthographicCamera(
    (0.25 * frustumSize * aspect) / -2,
    (0.25 * frustumSize * aspect) / 2,
    (0.5 * frustumSize) / 2,
    (0.5 * frustumSize) / -2,
    0.1,
    1000
  );
  camera4 = new THREE.OrthographicCamera(
    (0.25 * frustumSize * aspect) / -2,
    (0.25 * frustumSize * aspect) / 2,
    (0.5 * frustumSize) / 2,
    (0.5 * frustumSize) / -2,
    0.1,
    1000
  );
  camera5 = new THREE.OrthographicCamera(
    (0.25 * frustumSize * aspect) / -2,
    (0.25 * frustumSize * aspect) / 2,
    (0.5 * frustumSize) / 2,
    (0.5 * frustumSize) / -2,
    0.1,
    1000
  );
  camera.position.z = 30;
  camera2.position.z = 30;
  camera3.position.z = 30;
  camera4.position.z = 30;
  camera5.position.z = 30;

  // scene

  scene = new THREE.Scene();
  const ambient = new THREE.AmbientLight(0x666666);
  scene.add(ambient);

  const directionalLight = new THREE.DirectionalLight(0x887766);
  directionalLight.position.set(-1, 1, 1).normalize();
  scene.add(directionalLight);

  //clone scene four times
  for (let i = 0; i < 4; i++) {
    scenes.push(scene.clone());
  }

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  renderer.autoClear = false;
  effect = new OutlineEffect(renderer);

  modelFile = [
    'models/mmd/kizunaai/kizunaai.pmx',
    'models/mmd/KokoroAmamiya/KokoroAmamiya.pmx',
    'models/mmd/AliceMononobe/AliceMononobe.pmx',
  ];
  modelLocationFile = [
    'location/kizunaai.pmx.json',
    'location/KokoroAmamiya.pmx.json',
    'location/AliceMononobe.pmx.json',
  ];

  helper = new MMDAnimationHelper();

  loader = new MMDLoader();

  loadMMDs();

  //

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keypress', onKeyPress);

  //鏡頭控制
  initControlCamera();

  setTimeout(() => {
    //rotate iris
    rotateEye(0, 0, 0, 10);
  }, 3000);
}

// model
function onProgress(xhr) {
  if (xhr.lengthComputable) {
    const percentComplete = (xhr.loaded / xhr.total) * 100;
    console.log(Math.round(percentComplete, 2) + '% downloaded');
  }
}

function loadMMDs() {
  loadMMD(modelIndex, 0);
  loadMMD(modelIndex, 1);
  loadMMD(modelIndex, 2);
  loadMMD(modelIndex, 3);
}

function loadMMD(index, meshId) {
  if (isInitedList[meshId]) {
    // scene.remove(mesh);
    scenes[meshId].remove(meshes[meshId]);
  }
  loader.load(
    modelFile[index % modelFile.length],
    function (object) {
      mesh = object;
      mesh.position.y = -10;

      // try to rotate iris
      //   console.log(mesh.skeleton.bones);

      // add mesh
      meshes[meshId] = mesh;
      scenes[meshId].add(meshes[meshId]);

      isInitedList[meshId] = true;

      // scene.add(mesh);
    },
    onProgress,
    null
  );
}

function initControlCamera() {
  cameraControlsList.push({
    camera: camera,
    controls: controlCamera(camera),
  });
  cameraControlsList.push({
    camera: camera2,
    controls: controlCamera(camera2),
  });
  cameraControlsList.push({
    camera: camera3,
    controls: controlCamera(camera3),
  });
  cameraControlsList.push({
    camera: camera4,
    controls: controlCamera(camera4),
  });
  cameraControlsList.push({
    camera: camera5,
    controls: controlCamera(camera5),
  });

  zoomIn(0, -0.5, 8.2, 0.015);
  // zoomIn(0, 0.5, 8.2, 0.015);
  zoomIn(1, 0, 8, 0.11);
  zoomIn(2, 0, 8, 0.11);
  zoomIn(3, 0, 8, 0.11);
  zoomIn(4, 0, 8, 0.11);
}

function controlCamera(camera) {
  const cameracontrols = new OrbitControls(camera, renderer.domElement);
  cameracontrols.minDistance = 10;
  cameracontrols.maxDistance = 100;
  cameracontrols.enableRotate = false;
  // cameracontrols.enableZoom = true;
  return cameracontrols;
}

function zoomIn(index, x, y, scale) {
  const cameraControlsItem =
    cameraControlsList[index % cameraControlsList.length];
  cameraControlsItem['controls'].dIn(scale);
  cameraControlsItem['controls'].target = new THREE.Vector3(x, y, 0);
  cameraControlsItem['camera'].position.set(x, y, 30);
  cameraControlsItem['controls'].update();
}

function changeIris(index, x, y) {
  const cameraControlsItem =
    cameraControlsList[index % cameraControlsList.length];
  cameraControlsItem['controls'].target = new THREE.Vector3(x, y, 0);
  cameraControlsItem['camera'].position.set(x, y, 30);
  cameraControlsItem['controls'].update();
}

/**
 * meshId => mesh id
 * eye => 0 右眼, 1 左眼
 * axis => 0 上下, 1 左右
 * angle => 角度 會轉換成弧度
 * */
function rotateEye(meshId, eye, axis, angle) {
  //左眼
  if (eye === 1) {
    if (axis === 0) {
      meshes[meshId].skeleton.bones[86].rotation.x = angle * (Math.PI / 180);
    } else if (axis === 1) {
      meshes[meshId].skeleton.bones[86].rotation.y = angle * (Math.PI / 180);
    }
    //右眼
  } else if (eye === 0) {
    if (axis === 0) {
      meshes[meshId].skeleton.bones[88].rotation.x = angle * (Math.PI / 180);
    } else if (axis === 1) {
      meshes[meshId].skeleton.bones[88].rotation.y = angle * (Math.PI / 180);
    }
  }
}

function onKeyPress(e) {
  if (e.key === 'a' || e.key === 'A') {
    modelIndex--;
    if (modelIndex < 0) {
      modelIndex = modelFile.length - 1;
    }
    loadMMDs();
  } else if (e.key === 'd' || e.key === 'D') {
    modelIndex++;
    loadMMDs();
  } else if (e.key === 'q' || e.key === 'Q') {
  } else if (e.key === '1') {
    selectedIrisId--;
    if (selectedIrisId < 0) {
      selectedIrisId = 7;
    }
    renderSelectedIris(selectedIrisId);
  } else if (e.key === '2') {
    selectedIrisId++;
    if (selectedIrisId > 7) {
      selectedIrisId = 0;
    }
    renderSelectedIris(selectedIrisId);
  }
}

function onWindowResize() {
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;
  aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

  effect.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  camera.left = (0.5 * frustumSize * aspect) / -2;
  camera.right = (0.5 * frustumSize * aspect) / 2;
  camera.top = frustumSize / 2;
  camera.bottom = -frustumSize / 2;
  camera.updateProjectionMatrix();

  camera2.left = (0.25 * frustumSize * aspect) / -2;
  camera2.right = (0.25 * frustumSize * aspect) / 2;
  camera2.top = (0.5 * frustumSize) / 2;
  camera2.bottom = (-0.5 * frustumSize) / 2;
  camera2.updateProjectionMatrix();

  camera3.left = (0.25 * frustumSize * aspect) / -2;
  camera3.right = (0.25 * frustumSize * aspect) / 2;
  camera3.top = (0.5 * frustumSize) / 2;
  camera3.bottom = (-0.5 * frustumSize) / 2;
  camera3.updateProjectionMatrix();

  camera4.left = (0.25 * frustumSize * aspect) / -2;
  camera4.right = (0.25 * frustumSize * aspect) / 2;
  camera4.top = (0.5 * frustumSize) / 2;
  camera4.bottom = (-0.5 * frustumSize) / 2;
  camera4.updateProjectionMatrix();

  camera5.left = (0.25 * frustumSize * aspect) / -2;
  camera5.right = (0.25 * frustumSize * aspect) / 2;
  camera5.top = (0.5 * frustumSize) / 2;
  camera5.bottom = (-0.5 * frustumSize) / 2;
  camera5.updateProjectionMatrix();
}

//

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  effect.clear();

  effect.setViewport(0, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT);
  effect.render(scenes[parseInt(selectedIrisId / 2)], camera);

  effect.setViewport(
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT / 2,
    SCREEN_WIDTH / 4,
    SCREEN_HEIGHT / 2
  );
  effect.render(scenes[0], camera2);

  effect.setViewport(
    SCREEN_WIDTH / 2 + SCREEN_WIDTH / 4,
    SCREEN_HEIGHT / 2,
    SCREEN_WIDTH / 4,
    SCREEN_HEIGHT / 2
  );
  effect.render(scenes[1], camera3);

  effect.setViewport(SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 4, SCREEN_HEIGHT / 2);
  effect.render(scenes[2], camera4);

  effect.setViewport(
    SCREEN_WIDTH / 2 + SCREEN_WIDTH / 4,
    0,
    SCREEN_WIDTH / 4,
    SCREEN_HEIGHT / 2
  );
  effect.render(scenes[3], camera5);
}

function renderSelectedIris(irisId) {
  let eye = irisId % 2;
  let sceneId = parseInt(irisId / 2);
  //   console.log('sceneId ' + sceneId);
  //   console.log('eye ' + eye);
  //   console.log('irisId ' + irisId);

  if (eye === 1) {
    changeIris(0, 0.5, 8.2);
  } else {
    changeIris(0, -0.5, 8.2);
  }
}
