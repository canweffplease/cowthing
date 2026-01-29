import * as THREE from 'three';

var width = window.innerWidth;
var height = window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b12);

const camera = new THREE.PerspectiveCamera( 100, width / height, 0.1, 1000 );
camera.position.z = 12;


const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( width, height ); // add (.,.,false) to render lower res with width/2 height/2 frac
document.body.appendChild( renderer.domElement ); //always have to add the renderer to dom

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5,5,5);
scene.add(directionalLight);

// bound
const boxsize = 20;
const half = boxsize / 2;
//walls
const bounds = {x : half, y: half, z: half};
const cowtexture = new THREE.TextureLoader().load('/cowthing/cowtexture.png');

const cows = [];
const maxcows = 200;
const mincows = 1;
let isCulling = false;
const radius = 0.5;

function getRandomInt(max){
	return Math.floor(Math.random()*max);
}

function spawnCow(position, override = false){
	if (isCulling) return;
	if (cows.length >= maxcows) {
		isCulling = true;
		return;
	}
	var randInt = getRandomInt(10);
	if (randInt < 8 && override == false) return;
	const geometry = new THREE.SphereGeometry(radius, 32, 32);
  	const material = new THREE.MeshStandardMaterial({
    		map: cowtexture
  	});

  	const cow = new THREE.Mesh(geometry, material);
  	cow.position.copy(position);

  	cow.userData.velocity = new THREE.Vector3(
    		(Math.random() - 0.5) * 0.1,
    		(Math.random() - 0.5) * 0.1,
    		(Math.random() - 0.5) * 0.1
  	);

  	scene.add(cow);
  	cows.push(cow);
}

function removeCow(){
	if (cows.length <= mincows) return;
	
	var randInt = getRandomInt(10);
	if (randInt < 8) return;	
	const cow = cows.pop();
	scene.remove(cow);
	cow.geometry.dispose();
	cow.material.dispose();
}

// Spawn first cow
spawnCow(new THREE.Vector3(0, 0, 0), true);

function handleWallCollision(cow) {
  const p = cow.position;
  const v = cow.userData.velocity;
  let hitWall = false;

  ['x', 'y', 'z'].forEach(axis => {
    if (Math.abs(p[axis]) + radius > bounds[axis]) {
      v[axis] *= -1;
      p[axis] = Math.sign(p[axis]) * (bounds[axis] - radius);
      hitWall = true;
    }
  });

  //if (hitWall) {
  //  spawnCow(p.clone());
  //}
  if (!hitWall) return;
  if (isCulling){
    removeCow();
    if (cows.length <= mincows){
      isCulling = false;
    }
  }
  else
    spawnCow(p.clone());
}

function handleCowCollisions() {
  for (let i = 0; i < cows.length; i++) {
    for (let j = i + 1; j < cows.length; j++) {
      const a = cows[i];
      const b = cows[j];

      const delta = new THREE.Vector3().subVectors(b.position, a.position);
      const dist = delta.length();

      if (dist < radius * 2) {
        delta.normalize();

        const va = a.userData.velocity;
        const vb = b.userData.velocity;

        const temp = va.clone();
        va.copy(vb);
        vb.copy(temp);

        a.position.add(delta.clone().multiplyScalar(-0.05));
        b.position.add(delta.clone().multiplyScalar(0.05));
      }
    }
  }
}
function makeBackgroundText(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fontSize = 120;
  const lineHeight = fontSize * 1.2;
  const maxWidth = canvas.width * 0.85;

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, .7)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const { width } = ctx.measureText(testLine);

    if (width > maxWidth && line !== '') {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const startY =
    canvas.height / 2 - (lines.length - 1) * lineHeight / 2;

  lines.forEach((l, i) => {
    ctx.fillText(
      l.trim(),
      canvas.width / 2,
      startY + i * lineHeight
    );
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const geometry = new THREE.PlaneGeometry(40, 20);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -15;

  return mesh;
}
function makeBackgroundText2(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;

  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = 'bold 180px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const geometry = new THREE.PlaneGeometry(40, 20);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.z = -15;

  return mesh;
}
const text = "a spherical cow consumes grass and emits milk at a constant ration in an infinite field with no air resistance";
const bgText = makeBackgroundText(text);
scene.add(bgText);

let t = 0;

function animate() {
  t += 0.003;

  cows.forEach(cow => {
    cow.position.add(cow.userData.velocity);
    cow.rotation.y += 0.01;

    handleWallCollision(cow);
  });

  handleCowCollisions();

  // psychedelic color drift
  scene.background.setHSL(
    (Math.sin(t * 0.2) + 1) / 2,
    0.3,
    0.08
  );

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

