import { useRef, useEffect } from "react";
import { Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import {
  useTexture,
  useCubeTexture,
  Text3D,
  ContactShadows,
} from "@react-three/drei";
import nunito from "../assets/fonts/Nunito_SemiBold_Regular.json";
import { assetUrl } from "../lib/assetUrl";
import octaVert from "../shaders/octaVert.glsl";
import octaFrag from "../shaders/octaFrag.glsl";
import sphereVert from "../shaders/sphereVert.glsl";
import sphereFrag from "../shaders/sphereFrag.glsl";
import textVert from "../shaders/textVert.glsl";
import textFrag from "../shaders/textFrag.glsl";

export default function LoadingScreen({ position }) {
  const matcap = useTexture(
    assetUrl("matcaps/3B3C3F_DAD9D5_929290_ABACA8.png"),
  );
  const envmap = useCubeTexture(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: assetUrl("envmap/") },
  );
  const matcaptext = useTexture(
    assetUrl("matcaps/C7C7D7_4C4E5A_818393_6C6C74.png"),
  );

  const octahedronRef = useRef();
  const sphereRef = useRef();
  const textRef = useRef();
  const shapes = useRef([]);
  const targetRef = useRef();

  const numShapes = 10;
  const fade = 1.8;
  const delay = 1;
  let currentShape = 0;
  let opacity = 1;
  let elapsedTime = 0;

  // const targetPosition = new THREE.Vector3(x, y, z);

  useEffect(() => {
    shapes.current.forEach((shape, index) => {
      const angle = (index / numShapes) * Math.PI * 2;
      const x = Math.cos(angle) * 120;
      const y = Math.sin(angle) * -30;
      const z = Math.sin(angle) * 100;
      shape.position.set(x, y - 10, z - 180);
    });
  }, []);

  useFrame((state, delta) => {
    const { clock } = state;
    octahedronRef.current.material.uniforms.uTime.value =
      clock.getElapsedTime();
    sphereRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
    textRef.current.material.uniforms.uTime.value = clock.getElapsedTime();

    elapsedTime += delta;
    if (elapsedTime >= fade + delay) {
      elapsedTime = 0;
      currentShape = (currentShape + 1) % numShapes;
    }
    if (elapsedTime <= fade) {
      opacity = Math.max(0, 1 - elapsedTime / (fade * 0.5));
    } else {
      opacity = Math.min(1, (elapsedTime - (fade * 0.5 + delay)) / fade);
    }

    shapes.current.forEach((shape, index) => {
      shape.material.opacity = index === currentShape ? opacity : 1;
    });
  });

  return (
    <>
      <mesh
        ref={octahedronRef}
        position={position ? position : [0, 0, -160]}
        scale={[1, 1, 1]}
        rotation={[Math.PI * 0.15, 0, 0]}
        receiveShadow
        castShadow
      >
        <octahedronGeometry args={[10]} />
        <shaderMaterial
          attach="material"
          vertexShader={octaVert}
          fragmentShader={octaFrag}
          uniforms={{
            uTime: { value: 0.0 },
            uMatCap: { value: matcap },
            uBounceSpeed: { value: 1.0 },
            uBounceHeight: { value: 30.0 },
          }}
        />
      </mesh>

      <mesh
        ref={sphereRef}
        position={position ? position : [0, -10, -200]}
        scale={0.85}
        rotation={[0, 0, 0]}
        receiveShadow
        castShadow
      >
        <sphereGeometry args={[10]} />
        <shaderMaterial
          attach="material"
          vertexShader={sphereVert}
          fragmentShader={sphereFrag}
          uniforms={{
            uTime: { value: 0.0 },
            uEnvMap: { value: envmap },
            uMovementRadius: { value: 60.0 },
          }}
        />
      </mesh>

      <Text3D
        ref={textRef}
        font={nunito}
        position={[-50, 60, -150]}
        rotation={[0, 0, 0]}
        scale={[5, 5, 7]}
        letterSpacing={0.5}
        height={0.01}
        lineHeight={1}
        bevelEnabled
        bevelSize={0.1}
        bevelSegments={20}
        bevelThickness={0.25}
      >
        {`TANGIBLE VALUES`}
        <shaderMaterial
          attach="material"
          vertexShader={textVert}
          fragmentShader={textFrag}
          uniforms={{
            uTime: { value: 0.0 },
            uMatCapText: { value: matcaptext },
          }}
        />
      </Text3D>

      {[...Array(numShapes)].map((_, index) =>
        index % 2 === 0 ? (
          <mesh
            key={index}
            ref={(ref) => (shapes.current[index] = ref)}
            receiveShadow
            castShadow
          >
            <octahedronGeometry args={[2]} />
            <meshStandardMaterial color="#696870" transparent />
          </mesh>
        ) : (
          <mesh
            key={index}
            ref={(ref) => (shapes.current[index] = ref)}
            receiveShadow
            castShadow
          >
            <sphereGeometry args={[2]} />
            <meshStandardMaterial color="#44454c" transparent />
          </mesh>
        ),
      )}

      <ContactShadows
        opacity={1}
        scale={500}
        blur={1}
        far={1000}
        resolution={256}
        color="#000000"
      />

      <mesh
        receiveShadow
        rotation={[-Math.PI * 0.43, 0, 0]}
        position={[0, -45, -100]}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>

      <mesh position={new Vector3(0, 0, -150)} ref={targetRef} />
      <ambientLight intensity={1} />
      {/* <directionalLight
        position={[0, 100, -50]} 
        target={targetRef.current}
        intensity={1}
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024} 
        shadow-camera-far={1000} 
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadowCameraVisible 
      /> */}
    </>
  );
}
