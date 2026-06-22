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
      const charge = fgRef.current.d3Force('charge');
      if (charge) {
        charge.strength(-200); 
        charge.distanceMax(400); // Prevent infinite repulsion
      }
      
      const link = fgRef.current.d3Force('link');
      if (link) link.distance(40); 
      
      // Custom soft gravity to pull disconnected subgraphs together
      fgRef.current.d3Force('softCenter', (alpha) => {
        const nodes = fgRef.current.graphData().nodes;
        if (!nodes) return;
        nodes.forEach(node => {
          node.vx -= node.x * alpha * 0.02;
          node.vy -= node.y * alpha * 0.02;
        });
      });
    }
  }, [data]);

  const groupEntities = useMemo(() => new Set([
    "Hebrews", "Sinai", "Israelites", "Egyptians", "Philistines", "Jews", "Romans", 
    "Greeks", "Israel", "Egypt", "Amalekites", "Canaanites", "Edom", "Moab", "Moabites",
    "Midianites", "Pharisees", "Sadducees", "Samaritans", "Gentiles", "Babylonians",
    "Assyrians", "Chaldeans", "Amorites", "Jebusites", "Hittites", "Perizzites", "Hivites"
  ]), []);

  const graphData = useMemo(() => {
    if (!data || !data.nodes || !data.links) return { nodes: [], links: [] };
    
    const adj = {};
    const blockedNames = new Set([
      "Blessed Sacrament", "Beati immaculati", "Scriptures", 
      "Foreknown", "Virtues", "Grace", "Faith", "Hope", "Love", "Truth", 
      "Salvation", "Gospel", "Mercy", "Peace", "Glory", "Word"
    ]);
    
    const validNodes = data.nodes.filter(n => {
      // Fix trailing space duplicates in AI data
      const name = n.name.trim();
      if (!name) return false;
      
      if (blockedNames.has(name)) return false;

      if (name.toLowerCase().includes("project gutenberg")) return false;

      const firstChar = name.charAt(0);
      if (firstChar === firstChar.toLowerCase() && /[a-z]/i.test(firstChar)) {
        return false;
      }

      if (!isNaN(name.replace(/,/g, ''))) return false;
      
      if (name.toLowerCase().startsWith("a ") || name.toLowerCase().startsWith("an ") || name.toLowerCase().startsWith("the ")) {
        return false;
      }

      return true;
    });
    
    validNodes.forEach(n => { adj[n.id] = []; });
        // Only include links between valid nodes
    const validLinks = data.links.filter(l => adj[l.source] && adj[l.target]);
    
    const finalNodes = validNodes.map(node => ({ ...node }));
    const finalLinks = validLinks.map(link => ({ ...link }));

    finalNodes.forEach(node => {
      node.neighbors = new Set();
      node.links = [];
    });

    finalLinks.forEach(link => {
      const a = finalNodes.find(n => n.id === link.source);
      const b = finalNodes.find(n => n.id === link.target);
      if (a && b) {
        a.neighbors.add(b.id);
        b.neighbors.add(a.id);
        a.links.push(link);
        b.links.push(link);
      }
    });

    return { nodes: finalNodes, links: finalLinks };
  }, [data, groupEntities]);

  const handleNodeHover = useCallback((node) => {
    document.body.style.cursor = node ? 'pointer' : 'default';
    setHoverNode(node || null);
  }, []);

  const paintNode = useCallback((node, ctx, globalScale) => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return; 
    
    const isHovered = hoverNode && node.id === hoverNode.id;
    const isNeighbor = hoverNode && hoverNode.neighbors && hoverNode.neighbors.has(node.id);
    const isDimmed = hoverNode && !isHovered && !isNeighbor;
    
    let size = node.val ? Math.sqrt(node.val) * 1.5 : 3;
    const godTerms = ["Jesus", "God", "Christ", "Lord", "Holy Ghost", "Father"];
    const isGod = godTerms.includes(node.name);
    const isGroup = groupEntities.has(node.name);

    if (isGod) size = Math.max(size, 6); 

    ctx.beginPath();
    if (isGroup) {
      ctx.rect(node.x - size, node.y - size, size * 2, size * 2);
    } else {
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    }
    
    if (isDimmed) {
      ctx.fillStyle = '#e5e7e9';
    } else if (isHovered) {
      ctx.fillStyle = '#1f618d';
    } else if (isGod) {
      ctx.fillStyle = '#2980b9'; // Clean strong blue
    } else if (isGroup) {
      ctx.fillStyle = '#7d3c98'; // Deep clean purple
    } else {
      ctx.fillStyle = '#5bc0be'; // Professor's teal
    }
    
    ctx.fill();

    // Node border for clarity
    if (!isDimmed) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5 / globalScale;
      ctx.stroke();
    }

    const showLabel = isHovered || isNeighbor || isGod || globalScale >= 2;
    if (showLabel && !isDimmed) {
      const label = node.name;
      const isCentral = godTerms.includes(node.name);
      
      const isBold = isCentral || isHovered;
      const fontSize = isHovered ? 15 / globalScale : (isCentral ? 14 / globalScale : 11 / globalScale);
      
      ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px Georgia, serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const textPadding = 4 / globalScale;
      ctx.fillStyle = isHovered ? '#1a5276' : (isNeighbor ? '#111111' : '#444444');
      ctx.fillText(label, node.x + size + textPadding, node.y);
    }
  }, [hoverNode, groupEntities]);

  const getLinkColor = useCallback((link) => {
    const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
    const isDimmed = hoverNode && !isHovered;
    if (isHovered) return 'rgba(26, 82, 118, 0.9)'; // Dark blue for highlight
    if (isDimmed) return 'rgba(220, 220, 220, 0.15)'; // Very faint gray
    return 'rgba(91, 192, 190, 0.35)'; // Professor's cyan/teal color
  }, [hoverNode]);

  const getLinkWidth = useCallback((link) => {
    const isHovered = hoverNode && (link.source.id === hoverNode.id || link.target.id === hoverNode.id);
    const baseWidth = Math.sqrt(link.weight || 1) * 0.8;
    return isHovered ? baseWidth * 2 : baseWidth;
  }, [hoverNode]);

  const zoomedDataRef = useRef(null);

  const handleEngineStop = useCallback(() => {
    if (fgRef.current && zoomedDataRef.current !== data) {
      // Instead of zoomToFit (which fails if outliers exist), we explicitly center and zoom
      fgRef.current.centerAt(0, 0, 400);
      fgRef.current.zoom(1.8, 400);
      zoomedDataRef.current = data;
    }
  }, [data]);

  const [showCatalog, setShowCatalog] = useState(false);
  const sortedNames = useMemo(() => {
    return graphData.nodes.map(n => n.name).sort();
  }, [graphData.nodes]);

  return (
    <div className="graph-container" style={{ position: 'relative' }}>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        minZoom={0.6}
        maxZoom={6}
        graphData={graphData}
        nodeCanvasObject={paintNode}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkCurvature={0.25} // Beautiful curved links like the professor's
        onNodeHover={handleNodeHover}
        onEngineStop={handleEngineStop}
        d3VelocityDecay={0.3}
        backgroundColor="#ffffff"
      />
      
      <button 
        className="catalog-btn" 
        onClick={() => setShowCatalog(true)}
      >
        View Characters ({sortedNames.length})
      </button>

      {showCatalog && (
        <div className="catalog-modal-overlay" onClick={() => setShowCatalog(false)}>
          <div className="catalog-modal-content" onClick={e => e.stopPropagation()}>
            <div className="catalog-header">
              <h2>Characters in Book</h2>
              <button onClick={() => setShowCatalog(false)} className="close-btn">&times;</button>
            </div>
            <div className="catalog-list">
              {sortedNames.map(name => (
                <div key={name} className="catalog-item">{name}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
