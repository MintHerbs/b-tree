// Assigns x/y coordinates to all ERD nodes — grid layout with arc-biased attributes and repulsion

export function calculateERDLayout(erdData, manualPositions = {}) {
  const nodes = []
  const edges = []

  if (!erdData || !erdData.entities || erdData.entities.length === 0) {
    return { nodes, edges, bounds: { minX: -500, minY: -300, maxX: 500, maxY: 300, width: 1000, height: 600 } }
  }

  const entityMap = new Map()

  // --- Step 1: Entity grid ---
  const entityCount = erdData.entities.length
  const cols = Math.ceil(Math.sqrt(entityCount))
  const rows = Math.ceil(entityCount / cols)
  const H_SPACING = 380
  const V_SPACING = 320
  const gridW = (cols - 1) * H_SPACING
  const gridH = (rows - 1) * V_SPACING

  erdData.entities.forEach((entity, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)

    // Check if this entity has a manual position
    const manualPos = manualPositions[entity.id]
    
    const entityNode = {
      id: entity.id,
      type: 'entity',
      name: entity.name,
      x: manualPos?.manuallyPlaced ? manualPos.x : (-gridW / 2 + col * H_SPACING),
      y: manualPos?.manuallyPlaced ? manualPos.y : (-gridH / 2 + row * V_SPACING),
      width: Math.max(130, entity.name.length * 10 + 40),
      height: 54,
      isWeak: entity.isWeak || false,
      manuallyPlaced: manualPos?.manuallyPlaced || false,
      col, row
    }

    nodes.push(entityNode)
    entityMap.set(entity.id, entityNode)
  })

  // --- Step 2: Relationship placement at midpoint / centroid ---
  const relationshipMap = new Map()
  const relationships = erdData.relationships || []

  relationships.forEach((rel) => {
    const participants = rel.participants
      .map(p => entityMap.get(p.entityId))
      .filter(Boolean)

    // Check if this relationship has a manual position
    const manualPos = manualPositions[rel.id]
    
    let relX = 0, relY = 0
    if (!manualPos?.manuallyPlaced) {
      if (participants.length === 1) {
        relX = participants[0].x
        relY = participants[0].y - 200
      } else if (participants.length >= 2) {
        relX = participants.reduce((s, e) => s + e.x, 0) / participants.length
        relY = participants.reduce((s, e) => s + e.y, 0) / participants.length
      }
    } else {
      relX = manualPos.x
      relY = manualPos.y
    }

    const relNode = {
      id: rel.id,
      type: 'relationship',
      name: rel.name,
      x: relX, y: relY,
      width: Math.max(110, rel.name.length * 9 + 36),
      height: 64,
      isIdentifying: rel.isIdentifying || false,
      manuallyPlaced: manualPos?.manuallyPlaced || false
    }

    nodes.push(relNode)
    relationshipMap.set(rel.id, relNode)

    rel.participants.forEach((p) => {
      const entity = entityMap.get(p.entityId)
      if (!entity) return
      edges.push({
        type: 'relationship-entity',
        from: rel.id,
        to: p.entityId,
        fromNode: relNode,
        toNode: entity,
        cardinality: p.cardinality,
        participation: p.participation
      })
    })
  })

  // --- Step 3: Entity attributes — smart arc distribution away from neighbors ---
  let attrAnimIndex = 0

  erdData.entities.forEach((entity) => {
    const entityNode = entityMap.get(entity.id)
    if (!entityNode) return
    const attrs = entity.attributes || []
    if (attrs.length === 0) return

    // (1) Find all neighboring nodes and their angles
    const occupiedAngles = []
    
    // Add other entities as neighbors
    nodes.forEach(node => {
      if (node.id === entityNode.id || node.type === 'attribute') return
      const dx = node.x - entityNode.x
      const dy = node.y - entityNode.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 0 && distance < 500) { // Consider nodes within 500px as neighbors
        occupiedAngles.push(Math.atan2(dy, dx))
      }
    })
    
    // Add relationships this entity participates in
    relationships.forEach(rel => {
      const participates = rel.participants.some(p => p.entityId === entity.id)
      if (participates) {
        const relNode = relationshipMap.get(rel.id)
        if (relNode) {
          const dx = relNode.x - entityNode.x
          const dy = relNode.y - entityNode.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance > 0) {
            occupiedAngles.push(Math.atan2(dy, dx))
          }
        }
      }
    })

    // (2) & (3) Find the largest free arc
    let startAngle = 0
    let arcSpan = 2 * Math.PI // Default to full circle
    
    if (occupiedAngles.length > 0) {
      // Sort angles
      occupiedAngles.sort((a, b) => a - b)
      
      // Find largest gap between consecutive occupied angles
      let maxGap = 0
      let maxGapStart = 0
      
      for (let i = 0; i < occupiedAngles.length; i++) {
        const current = occupiedAngles[i]
        const next = occupiedAngles[(i + 1) % occupiedAngles.length]
        
        let gap
        if (i === occupiedAngles.length - 1) {
          // Wrap-around gap
          gap = (2 * Math.PI - current) + (next + 2 * Math.PI)
        } else {
          gap = next - current
        }
        
        if (gap > maxGap) {
          maxGap = gap
          maxGapStart = current
        }
      }
      
      // Use the largest free arc if it's significant (> 90 degrees)
      if (maxGap > Math.PI / 2) {
        startAngle = maxGapStart + 0.2 // Offset slightly from the occupied angle
        arcSpan = maxGap - 0.4 // Leave small margins
      }
    }

    // (4) Distribute attributes evenly within the free arc
    attrs.forEach((attr, i) => {
      // Check if this attribute has a manual position
      const manualPos = manualPositions[attr.id]
      
      let attrX, attrY
      if (manualPos?.manuallyPlaced) {
        attrX = manualPos.x
        attrY = manualPos.y
      } else {
        let angle
        if (attrs.length === 1) {
          // Single attribute: place at center of free arc
          angle = startAngle + arcSpan / 2
        } else {
          // Multiple attributes: distribute evenly
          angle = startAngle + (i / (attrs.length - 1)) * arcSpan
        }
        attrX = entityNode.x + Math.cos(angle) * 170
        attrY = entityNode.y + Math.sin(angle) * 170
      }
      
      const attrNode = {
        id: attr.id,
        type: 'attribute',
        name: attr.name,
        x: attrX,
        y: attrY,
        width: Math.max(90, attr.name.length * 8 + 28),
        height: 38,
        attrType: attr.type,
        animationIndex: attrAnimIndex++,
        manuallyPlaced: manualPos?.manuallyPlaced || false
      }
      nodes.push(attrNode)
      edges.push({ type: 'attribute-link', from: entity.id, to: attr.id, fromNode: entityNode, toNode: attrNode })
    })
  })

  // --- Step 4: Relationship attributes — 180° arc below at radius 100px ---
  relationships.forEach((rel) => {
    const relNode = relationshipMap.get(rel.id)
    if (!relNode) return
    const attrs = rel.attributes || []
    if (attrs.length === 0) return

    attrs.forEach((attr, i) => {
      // Check if this attribute has a manual position
      const manualPos = manualPositions[attr.id]
      
      let attrX, attrY
      if (manualPos?.manuallyPlaced) {
        attrX = manualPos.x
        attrY = manualPos.y
      } else {
        const angle = attrs.length === 1
          ? Math.PI / 2
          : (i / (attrs.length - 1)) * Math.PI
        attrX = relNode.x + Math.cos(angle) * 100
        attrY = relNode.y + Math.sin(angle) * 100
      }
      
      const attrNode = {
        id: attr.id,
        type: 'attribute',
        name: attr.name,
        x: attrX,
        y: attrY,
        width: Math.max(90, attr.name.length * 8 + 28),
        height: 38,
        attrType: attr.type,
        animationIndex: attrAnimIndex++,
        manuallyPlaced: manualPos?.manuallyPlaced || false
      }
      nodes.push(attrNode)
      edges.push({ type: 'attribute-link', from: rel.id, to: attr.id, fromNode: relNode, toNode: attrNode })
    })
  })

  // --- Step 5: IS-A hierarchies ---
  ;(erdData.isA || []).forEach((hierarchy) => {
    const parentEntity = entityMap.get(hierarchy.parent)
    if (!parentEntity) return

    // Check if this ISA triangle has a manual position
    const manualPos = manualPositions[hierarchy.id]
    
    const triangleNode = {
      id: hierarchy.id,
      type: 'isa',
      name: 'IS-A',
      x: manualPos?.manuallyPlaced ? manualPos.x : parentEntity.x,
      y: manualPos?.manuallyPlaced ? manualPos.y : (parentEntity.y + 150),
      width: 80,
      height: 60,
      manuallyPlaced: manualPos?.manuallyPlaced || false
    }

    nodes.push(triangleNode)
    edges.push({
      type: 'isa-parent',
      from: hierarchy.parent,
      to: hierarchy.id,
      fromNode: parentEntity,
      toNode: triangleNode,
      participation: hierarchy.participation
    })

    const childSpacing = 180
    const totalChildW = (hierarchy.children.length - 1) * childSpacing
    let childX = parentEntity.x - totalChildW / 2
    const childY = triangleNode.y + 150

    hierarchy.children.forEach((childId) => {
      const childEntity = entityMap.get(childId)
      if (!childEntity) return
      
      // Only update child position if not manually placed
      if (!childEntity.manuallyPlaced) {
        childEntity.x = childX
        childEntity.y = childY
      }
      childX += childSpacing
      edges.push({
        type: 'isa-child',
        from: hierarchy.id,
        to: childId,
        fromNode: triangleNode,
        toNode: childEntity
      })
    })
  })

  // --- Step 6: Repulsion — 40 iterations ---
  for (let iter = 0; iter < 40; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
        const nx = dx / dist
        const ny = dy / dist

        // AABB gap: negative = overlapping, positive = separated
        const overlapX = (a.width + b.width) / 2 - Math.abs(dx)
        const overlapY = (a.height + b.height) / 2 - Math.abs(dy)
        const gap = (overlapX > 0 && overlapY > 0)
          ? -Math.min(overlapX, overlapY)
          : Math.sqrt(Math.max(0, -overlapX) ** 2 + Math.max(0, -overlapY) ** 2)

        if (gap < 30) {
          const push = (30 - gap) * 0.5
          a.x -= nx * push * 0.5
          a.y -= ny * push * 0.5
          b.x += nx * push * 0.5
          b.y += ny * push * 0.5
        }
      }
    }
  }

  // Compute bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.width / 2)
    minY = Math.min(minY, node.y - node.height / 2)
    maxX = Math.max(maxX, node.x + node.width / 2)
    maxY = Math.max(maxY, node.y + node.height / 2)
  }

  return { nodes, edges, bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY } }
}

// Arc start angle biased away from occupied cardinal grid neighbors
function getEntityArcStartAngle(col, row, cols, entityCount) {
  const rows = Math.ceil(entityCount / cols)

  const occupiedAngles = [
    { dc: 1,  dr: 0,  angle: 0            },
    { dc: 0,  dr: 1,  angle: Math.PI / 2  },
    { dc: -1, dr: 0,  angle: Math.PI      },
    { dc: 0,  dr: -1, angle: -Math.PI / 2 }
  ]
    .filter(({ dc, dr }) => {
      const nc = col + dc
      const nr = row + dr
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) return false
      return (nr * cols + nc) < entityCount
    })
    .map(({ angle }) => angle)

  if (occupiedAngles.length === 0) return 0

  let bestAngle = 0
  let maxMinDist = -1

  for (let step = 0; step < 16; step++) {
    const testAngle = (step / 16) * 2 * Math.PI
    const minDist = Math.min(...occupiedAngles.map(na => {
      let diff = Math.abs(testAngle - na)
      if (diff > Math.PI) diff = 2 * Math.PI - diff
      return diff
    }))
    if (minDist > maxMinDist) {
      maxMinDist = minDist
      bestAngle = testAngle
    }
  }

  return bestAngle
}
