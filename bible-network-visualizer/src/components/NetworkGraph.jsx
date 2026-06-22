import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const NetworkGraph = ({ data }) => {
  const fgRef = useRef();
  const [hoverNode, setHoverNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 90 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight - 90 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-400);
      fgRef.current.d3Force('link').distance(60);
    }
  }, [data]);

  const { nodes, links } = useMemo(() => {
    if (!data || !data.nodes || !data.links) return { nodes: [], links: [] };
    
    // First, find all nodes that are actually connected
    const connectedIds = new Set();
    data.links.forEach(link => {
      connectedIds.add(link.source);
      connectedIds.add(link.target);
    });

    // Filter out isolated nodes and map
    const nodes = data.nodes
      .filter(n => connectedIds.has(n.id))
      .map(node => ({ ...node }));
      
    const links = data.links.map(link => ({ ...link }));

    nodes.forEach(node => {
      node.neighbors = new Set();
      node.links = [];
    });

    links.forEach(link => {
      const a = nodes.find(n => n.id === link.source);
      const b = nodes.find(n => n.id === link.target);
      if (a && b) {
        a.neighbors.add(b.id);
        b.neighbors.add(a.id);
        a.links.push(link);
        b.links.push(link);
      }
    });

    return { nodes, links };
  }, [data]);

  const handleNodeHover = useCallback((node) => {
    document.body.style.cursor = node ? 'pointer' : 'default';
    setHoverNode(node || null);
  }, []);

  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHovered = hoverNode === node;
    const isNeighbor = hoverNode && hoverNode.neighbors && hoverNode.neighbors.has(node.id);
    const isDimmed = hoverNode && !isHovered && !isNeighbor;

    let size = node.val ? Math.sqrt(node.val) * 1.5 : 3;
    const godTerms = ["Jesus", "God", "Christ", "Lord", "Holy Ghost", "Father"];
    if (godTerms.includes(node.name)) {
      size = Math.max(size, 7); // Ensure they are prominent
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    
    if (isHovered) {
      ctx.fillStyle = '#1a5276';
    } else if (isDimmed) {
      ctx.fillStyle = '#e5e7e9';
    } else {
      ctx.fillStyle = '#2874a6';
    }
    
    ctx.fill();

    if (!isDimmed || isHovered) {
      const label = node.name;
      const isCentral = godTerms.includes(node.name);
      const fontSize = isHovered ? 14 / globalScale : (isCentral ? 14 / globalScale : 11 / globalScale);
      
      ctx.font = `${isCentral ? 'bold' : 'normal'} ${fontSize}px Georgia, serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const textPadding = 4 / globalScale;
      ctx.fillStyle = isHovered ? '#000000' : (isNeighbor ? '#333333' : '#111111');
      ctx.fillText(label, node.x + size + textPadding, node.y);
    }
  }, [hoverNode]);

  const paintLink = useCallback((link, ctx, globalScale) => {
    const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
    const isDimmed = hoverNode && !isHovered;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    
    ctx.lineWidth = (link.weight || 1) * 0.5 / globalScale;
    
    if (isHovered) {
      ctx.strokeStyle = 'rgba(40, 116, 166, 0.8)';
    } else if (isDimmed) {
      ctx.strokeStyle = 'rgba(220, 220, 220, 0.2)';
    } else {
      ctx.strokeStyle = 'rgba(90, 160, 190, 0.3)';
    }
    
    ctx.stroke();
  }, [hoverNode]);

  return (
    <div className="graph-container">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{ nodes, links }}
        nodeCanvasObject={paintNode}
        linkCanvasObjectMode={() => 'replace'}
        linkCanvasObject={paintLink}
        onNodeHover={handleNodeHover}
        backgroundColor="#ffffff"
      />
    </div>
  );
};

export default NetworkGraph;
