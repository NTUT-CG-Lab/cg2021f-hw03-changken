import * as THREE from './build/three.module.js';
// import { GUI } from './jsm/libs/dat.gui.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { OutlineEffect } from './jsm/effects/OutlineEffect.js';
import { MMDLoader } from './jsm/loaders/MMDLoader.js';
import { MMDAnimationHelper } from './jsm/animation/MMDAnimationHelper.js';
import { clone } from './jsm/utils/SkeletonUtils.js';

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

//紀錄畫線
let lines = [];
for (let i = 0; i < 14; i++) {
  lines.push(null);
}

//紀錄線段位置
let location;
let lastSceneId;

//紀錄滑鼠位置
let mouseX = null,
  mouseY = null;

//鏡頭放大參數
let zoomInData = [
  [
    { x: -0.5, y: 8.2 },
    { x: 0, y: 8 },
  ],
  [
    { x: -0.5, y: 5.5 },
    { x: 0, y: 5.2 },
  ],
  [
    { x: -0.5, y: 4.5 },
    { x: 0, y: 4.3 },
  ], //TODO
];

//左右目的bone index
let eyeIndex = [
  { left: 86, right: 88 },
  { left: 49, right: 51 },
  { left: 11, right: 13 },
];

//紀錄iris旋轉角度
let irisRotation = {};

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
  window.addEventListener('mousedown', onMouseDown);

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
  loadMMD(modelIndex);
}

function loadMMD(index) {
  for (let i = 0; i < isInitedList.length; i++) {
    if (isInitedList[i]) {
      scenes[i].remove(meshes[i]);
    }
  }

  loader.load(
    modelFile[index % modelFile.length],
    async function (object) {
      mesh = object;
      mesh.position.y = -10;

      // try to rotate iris
      console.log(mesh.skeleton.bones);

      for (let i = 0; i < meshes.length; i++) {
        // add mesh
        meshes[i] = clone(mesh);
        scenes[i].add(meshes[i]);

        isInitedList[i] = true;
      }

      await loadModelLocation();
      drawLines();
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

  zoomIn(0, zoomInData[modelIndex][0].x, zoomInData[modelIndex][0].y, 0.02);
  // zoomIn(0, 0.5, 8.2, 0.015);
  zoomIn(1, zoomInData[modelIndex][1].x, zoomInData[modelIndex][1].y, 0.11);
  zoomIn(2, zoomInData[modelIndex][1].x, zoomInData[modelIndex][1].y, 0.11);
  zoomIn(3, zoomInData[modelIndex][1].x, zoomInData[modelIndex][1].y, 0.11);
  zoomIn(4, zoomInData[modelIndex][1].x, zoomInData[modelIndex][1].y, 0.11);
}

function setCameraPositionForIris() {
  changeIris(0, zoomInData[modelIndex][0].x, zoomInData[modelIndex][0].y);
  changeIris(1, zoomInData[modelIndex][1].x, zoomInData[modelIndex][1].y);
  changeIris(2, zoomInData[modelIndex][1].x, zoomInData[modelIndex][1].y);
  changeIris(3, zoomInData[modelIndex][1].x, zoomInData[modelIndex][1].y);
  changeIris(4, zoomInData[modelIndex][1].x, zoomInData[modelIndex][1].y);
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
      meshes[meshId].skeleton.bones[eyeIndex[modelIndex].left].rotation.x =
        angle * (Math.PI / 180);
    } else if (axis === 1) {
      meshes[meshId].skeleton.bones[eyeIndex[modelIndex].left].rotation.y =
        angle * (Math.PI / 180);
    }
    //右眼
  } else if (eye === 0) {
    if (axis === 0) {
      meshes[meshId].skeleton.bones[eyeIndex[modelIndex].right].rotation.x =
        angle * (Math.PI / 180);
    } else if (axis === 1) {
      meshes[meshId].skeleton.bones[eyeIndex[modelIndex].right].rotation.y =
        angle * (Math.PI / 180);
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
    setCameraPositionForIris();
  } else if (e.key === 'd' || e.key === 'D') {
    modelIndex++;
    loadMMDs();
    setCameraPositionForIris();
  } else if (e.key === 'q' || e.key === 'Q') {
  } else if (e.key === 's' || e.key === 'S') {
    saveIrisRotation();
  } else if (e.key === '1') {
    selectedIrisId--;
    if (selectedIrisId < 0) {
      selectedIrisId = 7;
    }
    renderSelectedIris(selectedIrisId);
    drawLines();
  } else if (e.key === '2') {
    selectedIrisId++;
    if (selectedIrisId > 7) {
      selectedIrisId = 0;
    }
    renderSelectedIris(selectedIrisId);
    drawLines();
  }
}

//載入已標記好的線
async function loadModelLocation() {
  const res = await fetch(
    modelLocationFile[modelIndex % modelLocationFile.length]
  );
  const json = await res.json();
  console.log(json);

  location = json;
}

//畫線
function drawLine(sceneId, color, i, vertical = false, x, y) {
  let geometry;

  //是直的 or 橫的線
  if (vertical) {
    geometry = new THREE.BoxGeometry(0.005, 1, 0);
  } else {
    geometry = new THREE.BoxGeometry(1, 0.005, 0);
  }

  //console.log("color: " + color);

  let material = new THREE.MeshBasicMaterial({ color: color });
  const line = new THREE.Mesh(geometry, material);

  line.position.x = x;
  line.position.y = y;
  line.position.z = 10;

  if (lines[i - 1] !== null) {
    scenes[lastSceneId].remove(lines[i - 1]);
  }

  lines[i - 1] = line;
  scenes[sceneId].add(lines[i - 1]);
}

function drawLines() {
  let eye = selectedIrisId % 2;

  const verticalColor = eye === 0 ? 0x0000ff : 0x00aeae;
  const horizontalColor = eye === 0 ? 0xff0000 : 0x5b00ae;

  let points = {
    x1: eye === 0 ? -location.line_locationx_1 : location.line_locationx_1,
    y1: location.line_locationy_1,
    x2: eye === 0 ? -location.line_locationx_2 : location.line_locationx_2,
    y2: location.line_locationy_2,
    x3: eye === 0 ? -location.line_locationx_3 : location.line_locationx_3,
    y3: location.line_locationy_3,
    x4: eye === 0 ? -location.line_locationx_4 : location.line_locationx_4,
    y4: location.line_locationy_4,
  };

  let verticalGap = points.y3 - points.y1;
  let horizontalGap = points.x4 - points.x2;

  let sceneId = parseInt(selectedIrisId / 2);

  drawLine(sceneId, horizontalColor, 1, false, points.x1, points.y1);
  drawLine(
    sceneId,
    horizontalColor,
    2,
    false,
    points.x1,
    points.y1 + verticalGap * (1 / 4)
  );
  drawLine(
    sceneId,
    horizontalColor,
    3,
    false,
    points.x1,
    points.y1 + verticalGap * (2 / 4)
  );
  drawLine(
    sceneId,
    horizontalColor,
    4,
    false,
    points.x1,
    points.y1 + verticalGap * (3 / 4)
  );
  drawLine(sceneId, horizontalColor, 5, false, points.x3, points.y3);
  drawLine(sceneId, verticalColor, 6, true, points.x2, points.y2);
  drawLine(
    sceneId,
    verticalColor,
    7,
    true,
    points.x2 + horizontalGap * (1 / 8),
    points.y2
  );
  drawLine(
    sceneId,
    verticalColor,
    8,
    true,
    points.x2 + horizontalGap * (2 / 8),
    points.y2
  );
  drawLine(
    sceneId,
    verticalColor,
    9,
    true,
    points.x2 + horizontalGap * (3 / 8),
    points.y2
  );
  drawLine(
    sceneId,
    verticalColor,
    10,
    true,
    points.x2 + horizontalGap * (4 / 8),
    points.y2
  );
  drawLine(
    sceneId,
    verticalColor,
    11,
    true,
    points.x2 + horizontalGap * (5 / 8),
    points.y2
  );
  drawLine(
    sceneId,
    verticalColor,
    12,
    true,
    points.x2 + horizontalGap * (6 / 8),
    points.y2
  );
  drawLine(
    sceneId,
    verticalColor,
    13,
    true,
    points.x2 + horizontalGap * (7 / 8),
    points.y2
  );
  drawLine(sceneId, verticalColor, 14, true, points.x4, points.y4);

  lastSceneId = sceneId;
}

function onMouseDown(e) {
  if (e.buttons === 1) {
    // console.log('left');
    window.addEventListener('mousemove', onMouseMove);
  } else if (e.buttons === 2) {
    // console.log('right');
    window.removeEventListener('mousemove', onMouseMove);
    mouseX = null;
    mouseY = null;
  }
}

function onMouseMove(e) {
  const mouseWorld = new THREE.Vector3();
  const { left, top, width, height } = e.target.getBoundingClientRect();
  mouseWorld.set(
    ((e.clientX - left + 1) / width) * 2 - 1,
    -((e.clientY - top + 1) / height) * 2 + 1,
    (camera.near + camera.far) / (camera.near - camera.far)
  );
  mouseWorld.unproject(camera);
  // console.log('project');
  // console.log(mouseWorld.x + ' ' + mouseWorld.y);

  // console.log(e.clientX, e.clientY);
  if (mouseX === null && mouseY === null) {
    mouseX = mouseWorld.x;
    mouseY = mouseWorld.y;
  }

  let deltaX = ((mouseWorld.x - mouseX) / mouseX) * 100;
  let deltaY = ((mouseWorld.y - mouseY) / mouseY) * 100;

  let selectedSceneId = parseInt(selectedIrisId / 2);
  let eye = selectedIrisId % 2;

  rotateEye(selectedSceneId, eye, 0, deltaY);
  rotateEye(selectedSceneId, eye, 1, deltaX);

  console.log(deltaX, deltaY);
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
    changeIris(0, -zoomInData[modelIndex][0].x, zoomInData[modelIndex][0].y);
  } else {
    changeIris(0, zoomInData[modelIndex][0].x, zoomInData[modelIndex][0].y);
  }
}

//儲存線座標資料
function saveIrisRotation() {
  irisRotation['Right X negative angle'] =
    meshes[0].skeleton.bones[eyeIndex[modelIndex].right].rotation.x;
  irisRotation['Left X negative angle'] =
    meshes[0].skeleton.bones[eyeIndex[modelIndex].left].rotation.x;
  irisRotation['Right X positive angle'] =
    meshes[1].skeleton.bones[eyeIndex[modelIndex].right].rotation.x;
  irisRotation['Left X positive angle'] =
    meshes[1].skeleton.bones[eyeIndex[modelIndex].left].rotation.x;
  irisRotation['Right Y negative angle'] =
    meshes[2].skeleton.bones[eyeIndex[modelIndex].right].rotation.y;
  irisRotation['Left Y negative angle'] =
    meshes[2].skeleton.bones[eyeIndex[modelIndex].left].rotation.y;
  irisRotation['Right Y positive angle'] =
    meshes[3].skeleton.bones[eyeIndex[modelIndex].right].rotation.y;
  irisRotation['Left Y positive angle'] =
    meshes[3].skeleton.bones[eyeIndex[modelIndex].left].rotation.y;

  // console.log('iris旋轉角度資料: ' + JSON.stringify(irisRotation));

  let modelFileName =
    modelFile[modelIndex]
      .split('/')
      [modelFile[modelIndex].split('/').length - 1].split('.')[0] +
    '_irisrotation';
  downloadObjectAsJson(irisRotation, modelFileName);
}

// download json method

function downloadObjectAsJson(exportObj, exportName) {
  let dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(exportObj));
  let downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', exportName + '.json');
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
