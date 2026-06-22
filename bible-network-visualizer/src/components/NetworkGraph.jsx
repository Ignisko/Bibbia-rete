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
      if (charge) charge.strength(-400);
      
      const link = fgRef.current.d3Force('link');
      if (link) link.distance(60);
    }
  }, [data]);

  const graphData = useMemo(() => {
    if (!data || !data.nodes || !data.links) return { nodes: [], links: [] };
    
    // Build adjacency list for BFS
    const adj = {};
    const blockedNames = new Set([
      "Hebrews", "Sinai", "Israelites", "Egyptians", "Philistines", "Jews", "Romans", 
      "Greeks", "Israel", "Egypt", "Blessed Sacrament", "Beati immaculati", "Scriptures"
    ]);
    
    // Only include valid nodes
    const validNodes = data.nodes.filter(n => {
      const name = n.name.trim();
      if (!name) return false;
      
      // Filter out explicit blocked names
      if (blockedNames.has(name)) return false;

      // Filter out names starting with lowercase letters (e.g., "meek", "bald head", "angustia temporum")
      const firstChar = name.charAt(0);
      if (firstChar === firstChar.toLowerCase() && /[a-z]/i.test(firstChar)) {
        return false;
      }

      // Filter out pure numbers
      if (!isNaN(name.replace(/,/g, ''))) return false;
      
      // Filter out garbage prefixes like "a " or "the "
      if (name.toLowerCase().startsWith("a ") || name.toLowerCase().startsWith("an ") || name.toLowerCase().startsWith("the ")) {
        return false;
      }

      return true;
    });
    
    validNodes.forEach(n => { adj[n.id] = []; });
    
    // Only include links between valid nodes
    data.links.forEach(l => {
      if (adj[l.source] && adj[l.target]) {
        adj[l.source].push(l.target);
        adj[l.target].push(l.source);
      }
    });

    // Find the largest connected component using BFS
    const visited = new Set();
    let largestComponent = new Set();

    validNodes.forEach(node => {
      if (!visited.has(node.id) && adj[node.id]) {
        const component = new Set();
        const queue = [node.id];
        visited.add(node.id);
        component.add(node.id);

        while (queue.length > 0) {
          const curr = queue.shift();
          adj[curr].forEach(neighbor => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              component.add(neighbor);
              queue.push(neighbor);
            }
          });
        }

        if (component.size > largestComponent.size) {
          largestComponent = component;
        }
      }
    });

    // Filter nodes and links to ONLY include the largest component
    const finalNodes = data.nodes
      .filter(n => largestComponent.has(n.id))
      .map(node => ({ ...node }));
      
    const finalLinks = data.links
      .filter(l => largestComponent.has(l.source) && largestComponent.has(l.target))
      .map(link => ({ ...link }));

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
      
      // Make hovered text bolder and larger
      const isBold = isCentral || isHovered;
      const fontSize = isHovered ? 15 / globalScale : (isCentral ? 14 / globalScale : 11 / globalScale);
      
      ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px Georgia, serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      const textPadding = 4 / globalScale;
      // Light up the text with the accent color
      ctx.fillStyle = isHovered ? '#1a5276' : (isNeighbor ? '#111111' : '#444444');
      ctx.fillText(label, node.x + size + textPadding, node.y);
    }
  }, [hoverNode]);

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
      fgRef.current.zoomToFit(400, 50);
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
