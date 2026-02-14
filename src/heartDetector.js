export class HeartDetector {
  constructor() {
    this.minPoints = 30;
    this.maxPoints = 150;
    this.similarityThreshold = 0.7;
    this.cooldown = false;
    this.cooldownDuration = 2000;
  }

  detectHeart(trail) {
    if (this.cooldown) return false;
    
    if (trail.length < this.minPoints || trail.length > this.maxPoints) {
      return false;
    }

    const normalizedTrail = this.normalizeTrail(trail);
    const heartShape = this.generateHeartShape();
    const similarity = this.calculateSimilarity(normalizedTrail, heartShape);

    if (similarity > this.similarityThreshold) {
      this.startCooldown();
      return true;
    }

    return false;
  }

  normalizeTrail(trail) {
    const minX = Math.min(...trail.map(p => p.x));
    const maxX = Math.max(...trail.map(p => p.x));
    const minY = Math.min(...trail.map(p => p.y));
    const maxY = Math.max(...trail.map(p => p.y));

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.max(width, height);

    if (scale === 0) return trail;

    return trail.map(p => ({
      x: (p.x - minX) / scale,
      y: (p.y - minY) / scale
    }));
  }

  generateHeartShape() {
    const points = [];
    const steps = 50;

    for (let i = 0; i < steps; i++) {
      const t = (Math.PI * 2 * i) / steps;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      
      points.push({
        x: (x + 16) / 32,
        y: (y + 16) / 32
      });
    }

    return points;
  }

  calculateSimilarity(trail, heartShape) {
    const matchedPoints = [];
    const usedHeartIndices = new Set();

    for (const trailPoint of trail) {
      let bestMatch = null;
      let bestDistance = Infinity;

      for (let i = 0; i < heartShape.length; i++) {
        if (usedHeartIndices.has(i)) continue;

        const heartPoint = heartShape[i];
        const distance = Math.sqrt(
          Math.pow(trailPoint.x - heartPoint.x, 2) +
          Math.pow(trailPoint.y - heartPoint.y, 2)
        );

        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = i;
        }
      }

      if (bestMatch !== null && bestDistance < 0.15) {
        matchedPoints.push(bestDistance);
        usedHeartIndices.add(bestMatch);
      }
    }

    if (matchedPoints.length < trail.length * 0.5) {
      return 0;
    }

    const avgDistance = matchedPoints.reduce((a, b) => a + b, 0) / matchedPoints.length;
    const coverage = matchedPoints.length / heartShape.length;
    
    return coverage * (1 - avgDistance);
  }

  checkClosure(trail) {
    if (trail.length < 20) return false;

    const first = trail[0];
    const last = trail[trail.length - 1];
    const distance = Math.sqrt(
      Math.pow(last.x - first.x, 2) +
      Math.pow(last.y - first.y, 2)
    );

    const trailLength = this.calculateTrailLength(trail);
    return distance < trailLength * 0.15;
  }

  calculateTrailLength(trail) {
    let length = 0;
    for (let i = 1; i < trail.length; i++) {
      const dx = trail[i].x - trail[i - 1].x;
      const dy = trail[i].y - trail[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }

  startCooldown() {
    this.cooldown = true;
    setTimeout(() => {
      this.cooldown = false;
    }, this.cooldownDuration);
  }

  reset() {
    this.cooldown = false;
  }
}
