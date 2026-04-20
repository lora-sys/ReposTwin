/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";

const GROUP_COLORS: Record<number, string> = {
  1: "#22C55E",
  2: "#38BDF8",
  3: "#A78BFA",
  4: "#F472B6",
  5: "#64748B",
};

const SPHERE_GEO = new THREE.SphereGeometry(1, 16, 16);

interface GraphNode {
  id: string;
  group: number;
  size: number;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: Array<{
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
  }>;
}

interface ForceGraph3DComponentProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  highlightedNode?: string | null;
}

export default function ForceGraph3DComponent({
  data,
  onNodeClick,
  highlightedNode,
}: ForceGraph3DComponentProps) {
  const fgRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const matCache = useRef<Map<string, THREE.MeshStandardMaterial>>(new Map());

  const getMaterial = (isHighlighted: boolean, isHovered: boolean, baseColor: string) => {
    const key = `${isHighlighted}-${isHovered}-${baseColor}`;
    if (!matCache.current.has(key)) {
      matCache.current.set(key, new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.6 }));
    }
    const mat = matCache.current.get(key)!;
    mat.color.set(isHighlighted ? "#EF4444" : isHovered ? "#F8FAFC" : baseColor);
    mat.emissive.set(isHighlighted ? "#EF4444" : isHovered ? "#666666" : "#000000");
    mat.emissiveIntensity = isHighlighted ? 0.6 : isHovered ? 0.3 : 0.1;
    return mat;
  };

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (fgRef.current) {
        fgRef.current.cameraPosition(
          { x: (node.x ?? 0) + 20, y: (node.y ?? 0) + 20, z: (node.z ?? 0) + 20 },
          { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 },
          1000
        );
      }
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node?.id ?? null);
  }, []);

  useEffect(() => {
    const cache = matCache.current;
    return () => {
      cache.forEach((mat) => mat.dispose());
      cache.clear();
      SPHERE_GEO.dispose();
    };
  }, []);

  return (
    <Canvas camera={{ position: [30, 30, 30], fov: 60 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[50, 50, 50]} intensity={1} />
      <pointLight position={[-50, -50, -50]} intensity={0.3} color="#38BDF8" />

      <ForceGraph3D
        ref={fgRef}
        graphData={data as any}
        nodeId="id"
        nodeThreeObject={(node: any) => {
          const color = GROUP_COLORS[node.group] ?? "#64748B";
          const radius = Math.max(2, node.size * 0.8);
          const isHovered = hoveredNode === node.id;
          const isHighlighted = highlightedNode === node.id;
          const group = new THREE.Group();
          const mesh = new THREE.Mesh(SPHERE_GEO, getMaterial(isHighlighted, isHovered, color));
          mesh.scale.setScalar(radius);
          mesh.userData = { nodeId: node.id };
          group.add(mesh);
          return group;
        }}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => "#334155"}
        linkDirectionalParticleSpeed={0.005}
        onNodeClick={handleNodeClick as any}
        onNodeHover={handleNodeHover as any}
        cooldownTicks={100}
        warmupTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />
    </Canvas>
  );
}
