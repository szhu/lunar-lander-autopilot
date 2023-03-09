// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const Stats = {
  gameEndData: {},
  angle: 0,
  projectedAngle: 0,
  rotationalVelocity: 0,
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  groundedHeight: 0,
};

const GRAVITY = 0.004;
const LANDER_HEIGHT = 40;
const CRASH_VELOCITY = 0.6;
const VELOCITY_MULTIPLIER = 20;
const CRASH_ANGLE = 11;
const generateCanvas = ({ width, height, attachNode }) => {
  const element = document.createElement("canvas");
  const context = element.getContext("2d");
  element.style.width = width + "px";
  element.style.height = height + "px";
  const scale = window.devicePixelRatio;
  element.width = Math.floor(width * scale);
  element.height = Math.floor(height * scale);
  context.scale(scale, scale);
  document.querySelector(attachNode).appendChild(element);
  return [context, width, height, element];
};
const animate = (drawFunc) => {
  let startTime = Date.now();
  let currentFrameTime = Date.now();
  const resetStartTime = () => (startTime = Date.now());
  const drawFuncContainer = () => {
    currentFrameTime = Date.now();
    drawFunc(currentFrameTime - startTime);
    window.requestAnimationFrame(drawFuncContainer);
  };
  window.requestAnimationFrame(drawFuncContainer);
  return {
    resetStartTime,
  };
};
const randomBool = (probability = 0.5) => Math.random() >= probability;
const randomBetween = (min, max) => Math.random() * (max - min) + min;
const getVectorVelocity = (velocity) =>
  Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2));
const getAngleDeltaUpright = (angle) => {
  const angleInDeg = (angle * 180) / Math.PI;
  const repeatingAngle = Math.abs(angleInDeg) % 360;
  return repeatingAngle > 180 ? Math.abs(repeatingAngle - 360) : repeatingAngle;
};
const getAngleDeltaUprightWithSign = (angle) => {
  const angleInDeg = (angle * 180) / Math.PI;
  const repeatingAngle = Math.abs(angleInDeg) % 360;
  return repeatingAngle > 180 ? repeatingAngle - 360 : repeatingAngle;
};
const velocityInMPH = (velocity) =>
  Intl.NumberFormat().format((getVectorVelocity(velocity) * 20).toFixed(1));
const heightInFeet = (yPos, groundedHeight) =>
  Intl.NumberFormat().format(
    Math.abs(Math.round((yPos - groundedHeight) / 3.5))
  );
const progress = (start, end, current) => (current - start) / (end - start);
const percentProgress = (start, end, current) =>
  Math.max(0, Math.min(((current - start) / (end - start)) * 100, 100));
const simpleBallisticUpdate = (
  currentPosition,
  currentVelocity,
  currentAngle,
  groundedHeight,
  rotationDirection,
  currentRotationVelocity,
  canvasWidth
) => {
  const newPosition = {
    ...currentPosition,
  };
  const newVelocity = {
    ...currentVelocity,
  };
  let newRotationVelocity;
  let newAngle = currentAngle;
  newPosition.y = Math.min(
    currentPosition.y + currentVelocity.y,
    groundedHeight + 1
  );
  newPosition.x = currentPosition.x + currentVelocity.x;
  if (newPosition.y <= groundedHeight) {
    newRotationVelocity = rotationDirection
      ? currentRotationVelocity + randomBetween(0, 0.01)
      : currentRotationVelocity - randomBetween(0, 0.01);
    newAngle = currentAngle + (Math.PI / 180) * newRotationVelocity;
    newVelocity.y = currentVelocity.y + GRAVITY;
    if (newPosition.x < 0) newPosition.x = canvasWidth;
    if (newPosition.x > canvasWidth) newPosition.x = 0;
  } else {
    newVelocity.x = currentVelocity.x / randomBetween(1.5, 3);
    newVelocity.y = -currentVelocity.y / randomBetween(1.5, 3);
    newRotationVelocity = currentRotationVelocity / 2;
  }
  return [newPosition, newVelocity, newRotationVelocity, newAngle];
};
const drawLanderGradient = (CTX, width = 20) => {
  const gradient = CTX.createLinearGradient(-width / 2, 0, width / 2, 0);
  gradient.addColorStop(0, "#DFE5E5");
  gradient.addColorStop(0.3, "#BDBCC3");
  gradient.addColorStop(0.6, "#4A4E6F");
  gradient.addColorStop(1, "#3D4264");
  return gradient;
};
const makeExplosion = (state, position, velocity, angle) => {
  const CTX = state.get("CTX");
  const canvasWidth = state.get("canvasWidth");
  const canvasHeight = state.get("canvasHeight");
  const _makeLanderChunk = (drawInstructions, yOffset) => {
    const _rotationDirection = randomBool();
    const _height = 40 / 3 + yOffset;
    const _groundedHeight = canvasHeight - _height + _height / 2;
    let _position = {
      ...position,
    };
    let _velocity = {
      ...velocity,
    };
    let _rotationVelocity = 0.1;
    let _angle = 0;
    const draw = () => {
      [_position, _velocity, _rotationVelocity, _angle] = simpleBallisticUpdate(
        _position,
        _velocity,
        _angle,
        _groundedHeight,
        _rotationDirection,
        _rotationVelocity,
        canvasWidth
      );
      CTX.save();
      CTX.translate(_position.x, _position.y);
      CTX.rotate(angle);
      CTX.fillStyle = drawLanderGradient(CTX);
      CTX.translate(0, yOffset);
      CTX.rotate(_angle);
      CTX.beginPath();
      drawInstructions();
      CTX.closePath();
      CTX.fill();
      CTX.restore();
    };
    return {
      draw,
    };
  };
  const _makeRandomExplosionPiece = (position, velocity) => {
    const _width = randomBetween(2, 20);
    const _height = randomBetween(2, 20);
    const _rotationDirection = randomBool();
    const _groundedHeight = canvasHeight - _height + _height / 2;
    let _position = {
      ...position,
    };
    let _velocity = {
      x: randomBetween(velocity.x / 4, velocity.x) + randomBetween(-0.1, 0.1),
      y: velocity.y + randomBetween(-0.1, 0.1),
    };
    let _rotationVelocity = 0.1;
    let _angle = Math.PI * 2;
    const draw = () => {
      [_position, _velocity, _rotationVelocity, _angle] = simpleBallisticUpdate(
        _position,
        _velocity,
        _angle,
        _groundedHeight,
        _rotationDirection,
        _rotationVelocity,
        canvasWidth
      );
      CTX.save();
      CTX.fillStyle = drawLanderGradient(CTX);
      CTX.translate(_position.x, _position.y);
      CTX.rotate(_angle);
      CTX.fillRect(-_width / 2, -_height / 2, _width, _height);
      CTX.restore();
    };
    return {
      draw,
    };
  };
  const noseCone = _makeLanderChunk(() => {
    CTX.moveTo(-20 / 2, 40 / 4 - 4);
    CTX.lineTo(0, -40 / 4 - 4);
    CTX.lineTo(20 / 2, 40 / 4 - 4);
  }, -40 / 2 + 4);
  const chunk1 = _makeLanderChunk(() => {
    CTX.moveTo(-20 / 2, -40 / 4);
    CTX.lineTo(20 / 2, -40 / 4);
    CTX.lineTo(20 / 2, 40 / 4);
    CTX.lineTo(-20 / 2, 40 / 4);
  }, 40 / 2);
  const chunk2 = _makeLanderChunk(() => {
    CTX.lineTo(-20 / 2, -40 / 4);
    CTX.lineTo(20 / 2, -40 / 4);
    CTX.lineTo(20 / 2, 40 / 4);
    CTX.lineTo(-20 / 2, 40 / 4);
  }, 0);
  const smallExplosionChunks = new Array(32)
    .fill()
    .map(() => _makeRandomExplosionPiece(position, velocity));
  const draw = () => {
    noseCone.draw();
    chunk1.draw();
    chunk2.draw();
    smallExplosionChunks.forEach((e) => e.draw());
  };
  return {
    draw,
  };
};
const makeConfetti = (state, amount, passedPosition, passedVelocity) => {
  const CTX = state.get("CTX");
  const canvasWidth = state.get("canvasWidth");
  const canvasHeight = state.get("canvasHeight");
  const audio = state.get("audioManager");
  const confettiTypeAmount = Math.round(amount / 2);
  let hasPlayedAudio = false;
  const _startingPosition = (index) =>
    passedPosition
      ? passedPosition
      : {
          x: canvasWidth / 2 + index - confettiTypeAmount / 2,
          y: canvasHeight / 2,
        };
  const _startingVelocity = (index) =>
    passedVelocity
      ? {
          x:
            index < confettiTypeAmount / 2
              ? passedVelocity.x - 1
              : passedVelocity.x + 1,
          y: passedVelocity.y - 0.6,
        }
      : {
          x: index < confettiTypeAmount / 2 ? -0.5 : 0.5,
          y: -1,
        };
  const _makeConfettiPiece = (position, velocity) => {
    const _size = randomBetween(1, 6);
    const _rotationDirection = randomBool();
    const _groundedHeight = canvasHeight - _size + _size / 2;
    const _color = `hsl(${randomBetween(0, 360)}, 100%, 50%)`;
    let _position = {
      ...position,
    };
    let _velocity = {
      x: velocity.x + randomBetween(-0.5, 0.5),
      y: velocity.y + randomBetween(-0.1, 0.1),
    };
    let _rotationVelocity = 0.1;
    let _angle = Math.PI * 2;
    const draw = () => {
      [_position, _velocity, _rotationVelocity, _angle] = simpleBallisticUpdate(
        _position,
        _velocity,
        _angle,
        _groundedHeight,
        _rotationDirection,
        _rotationVelocity,
        canvasWidth
      );
      CTX.save();
      CTX.fillStyle = _color;
      CTX.translate(_position.x, _position.y);
      CTX.rotate(_angle);
      CTX.fillRect(-_size / 2, -_size / 2, _size, _size);
      CTX.restore();
    };
    return {
      draw,
    };
  };
  const _makeTwirlPiece = (position, velocity) => {
    const _size = randomBetween(4, 8);
    const _groundedHeight = canvasHeight - _size + _size / 2;
    const _color = `hsl(${randomBetween(0, 360)}, 100%, 50%)`;
    const _rotationDirection = randomBool();
    let _position = {
      ...position,
    };
    let _velocity = {
      x: velocity.x + randomBetween(-0.5, 0.5),
      y: velocity.y + randomBetween(-0.1, 0.1),
    };
    let _rotationVelocity = 0;
    const mirroredLoopingProgress = (start, end, current) => {
      const loopedProgress = progress(start, end, current) % 1;
      return Math.floor(current / end) % 2
        ? Math.abs(loopedProgress - 1)
        : loopedProgress;
    };
    const draw = () => {
      [_position, _velocity, _rotationVelocity] = simpleBallisticUpdate(
        _position,
        _velocity,
        0,
        _groundedHeight,
        _rotationDirection,
        _rotationVelocity,
        canvasWidth
      );
      const width =
        mirroredLoopingProgress(0, 0.1, Math.abs(_rotationVelocity)) * _size;
      CTX.save();
      CTX.fillStyle = _color;
      CTX.translate(_position.x, _position.y);
      CTX.beginPath();
      CTX.moveTo(-width / 2, 0);
      CTX.lineTo(0, -_size / 2);
      CTX.lineTo(width / 2, 0);
      CTX.lineTo(0, _size / 2);
      CTX.closePath();
      CTX.fill();
      CTX.restore();
    };
    return {
      draw,
    };
  };
  const confettiPieces = new Array(confettiTypeAmount)
    .fill()
    .map((_, index) =>
      _makeConfettiPiece(_startingPosition(index), _startingVelocity(index))
    );
  const twirlPieces = new Array(confettiTypeAmount)
    .fill()
    .map((_, index) =>
      _makeTwirlPiece(_startingPosition(index), _startingVelocity(index))
    );
  const draw = () => {
    if (!hasPlayedAudio) {
      audio.playConfetti();
      hasPlayedAudio = true;
    }
    confettiPieces.forEach((e) => e.draw());
    twirlPieces.forEach((e) => e.draw());
  };
  return {
    draw,
  };
};
const landingScoreDescription = (score) => {
  const description =
    score >= 99
      ? "Perfect landing, incredible, you can’t get better than this"
      : score >= 95
      ? "Near-perfect landing, super smooth"
      : score >= 90
      ? "Very nice landing, amazing"
      : score >= 85
      ? "Pretty good landing, keep going!"
      : score >= 80
      ? "A good landing, keep trying"
      : score >= 75
      ? "Just shy of a good landing"
      : score >= 70
      ? "A solid “C” landing"
      : score >= 65
      ? "You landed but it could have been slower and straighter"
      : score >= 60
      ? "Not the worst landing, but not very good either"
      : score >= 55
      ? "Pretty bad landing, but it could be worse"
      : score >= 55
      ? "Not great"
      : score >= 40
      ? "Basically a fender bender, but you landed"
      : score >= 30
      ? "A near-crash, way too fast"
      : "Terrible landing, you need to land slow and straight";
  return description;
};
const crashScoreDescription = (score) => {
  const description =
    score >= 100
      ? "Unbelievable, the crater is visible from Earth"
      : score >= 95
      ? "Ludicrous crash! The debris has entered orbit"
      : score >= 90
      ? "Incredible crash, the lander has vaporized"
      : score >= 85
      ? "Impressive speed, impressive angle - you crashed with style"
      : score >= 80
      ? "A fast crash, but it could be faster"
      : score >= 75
      ? "I think you meant to do that"
      : score >= 70
      ? "You definitely did not land…"
      : score >= 65
      ? "I think there’s a problem with the lander"
      : score >= 60
      ? "Sick crash!"
      : score >= 50
      ? "Were you trying to land, or…"
      : score >= 40
      ? "A bad crash, but it could be worse"
      : score >= 30
      ? "I don’t think we’re getting back to Earth"
      : score >= 20
      ? "A smooth… wait… you crashed"
      : score >= 10
      ? "The lander has been… damaged"
      : "So, so close to a landing, but still a crash";
  return description;
};
const scoreLanding = (angle, speed) => {
  const worstPossibleCombo = 11 + 0.6 * 20;
  return progress(worstPossibleCombo, 1, angle + speed * 20) * 100;
};
const scoreCrash = (angle, speed) => {
  const worstPossibleCombo = Math.min(0.6 * 20, 11);
  return progress(worstPossibleCombo, 900, angle + speed * 20) * 100;
};
const drawTrajectory = (
  state,
  currentPosition,
  currentAngle,
  currentVelocity,
  currentRotationVelocity,
  groundedHeight
) => {
  const CTX = state.get("CTX");
  const canvasHeight = state.get("canvasHeight");
  let projectedXPosition = currentPosition.x;
  let projectedYPosition = currentPosition.y;
  let projectedAngle = currentAngle;
  let projectedYVelocity = currentVelocity.y;
  let index = 0;
  CTX.save();
  CTX.translate(20 / 2, 40 / 2);
  CTX.beginPath();
  CTX.moveTo(projectedXPosition - 20 / 2, projectedYPosition - 40 / 2);
  while (projectedYPosition < groundedHeight) {
    projectedYPosition = Math.min(
      projectedYPosition + projectedYVelocity,
      groundedHeight
    );
    projectedXPosition += currentVelocity.x;
    projectedAngle += (Math.PI / 180) * currentRotationVelocity;
    projectedYVelocity += GRAVITY;
    if (index % 2) {
      CTX.lineTo(projectedXPosition - 20 / 2, projectedYPosition - 40 / 2);
    }
    if (index === 2) {
      let dy = projectedYPosition - currentPosition.y;
      let dx = projectedXPosition - currentPosition.x;
      Stats.projectedAngle = Math.atan(-dx / dy);
    }
    index++;
  }
  CTX.strokeStyle = "rgb(255, 255, 255, .25)";
  CTX.stroke();
  if (Math.abs((projectedAngle * 180) / Math.PI - 360) < 11) {
    CTX.strokeStyle = "rgb(0, 255, 0)";
  } else {
    CTX.strokeStyle = "rgb(255, 0, 0)";
  }
  const arrowSize = Math.min(projectedYVelocity * 4, 20);
  CTX.translate(projectedXPosition - 20 / 2, canvasHeight - 40);
  CTX.rotate(projectedAngle + Math.PI);
  CTX.beginPath();
  CTX.moveTo(0, 0);
  CTX.lineTo(0, 40);
  CTX.lineTo(-arrowSize, 40);
  CTX.lineTo(0, 40 + arrowSize);
  CTX.lineTo(arrowSize, 40);
  CTX.lineTo(0, 40);
  CTX.closePath();
  CTX.stroke();
  CTX.restore();
};
const makeLander = (state, onGameEnd, onResetXPos) => {
  const CTX = state.get("CTX");
  const canvasWidth = state.get("canvasWidth");
  const canvasHeight = state.get("canvasHeight");
  const _thrust = 0.01;
  const _groundedHeight = canvasHeight - 40 + 40 / 2;
  Stats.groundedHeight = _groundedHeight;
  let _position;
  let _velocity;
  let _rotationVelocity;
  let _angle;
  let _engineOn;
  let _rotatingLeft;
  let _rotatingRight;
  let _gameEndData;
  let _flipConfetti;
  let _lastRotation;
  let _lastRotationAngle;
  let _rotationCount;
  let _maxVelocity;
  let _maxHeight;
  let _engineUsed;
  let _engineUsedPreviousFrame;
  let _boostersUsed;
  let _boostersUsedPreviousFrame;
  let _babySoundPlayed;
  const resetProps = () => {
    _position = {
      x: randomBetween(canvasWidth * 0.33, canvasWidth * 0.66),
      y: LANDER_HEIGHT * 2,
    };
    _velocity = {
      x: randomBetween(
        -_thrust * (canvasWidth / 10),
        _thrust * (canvasWidth / 10)
      ),
      y: randomBetween(0, _thrust * (canvasWidth / 10)),
    };
    _rotationVelocity = randomBetween(-0.1, 0.1);
    _angle = randomBetween(Math.PI * 1.5, Math.PI * 2.5);
    _engineOn = false;
    _rotatingLeft = false;
    _rotatingRight = false;
    Stats.gameEndData = _gameEndData = false;
    _flipConfetti = [];
    _lastRotation = 1;
    _lastRotationAngle = Math.PI * 2;
    _rotationCount = 0;
    _maxVelocity = {
      ..._velocity,
    };
    _maxHeight = _position.y;
    _engineUsed = 0;
    _engineUsedPreviousFrame = false;
    _boostersUsed = 0;
    _boostersUsedPreviousFrame = false;
    _babySoundPlayed = false;
  };
  resetProps();
  const _setGameEndData = (landed, timeSinceStart) => {
    Stats.gameEndData = _gameEndData = {
      landed,
      speed: velocityInMPH(_velocity),
      angle: getAngleDeltaUpright(_angle).toFixed(1),
      durationInSeconds: Intl.NumberFormat().format(
        Math.round(timeSinceStart / 1000)
      ),
      rotations: Intl.NumberFormat().format(_rotationCount),
      maxSpeed: velocityInMPH(_maxVelocity),
      maxHeight: heightInFeet(_maxHeight, _groundedHeight),
      engineUsed: Intl.NumberFormat().format(_engineUsed),
      boostersUsed: Intl.NumberFormat().format(_boostersUsed),
      speedPercent: percentProgress(
        0,
        CRASH_VELOCITY,
        getVectorVelocity(_velocity)
      ),
      anglePercent: percentProgress(
        0,
        CRASH_ANGLE,
        getAngleDeltaUpright(_angle)
      ),
    };
    if (landed) {
      const score = scoreLanding(
        getAngleDeltaUpright(_angle),
        getVectorVelocity(_velocity)
      );
      _gameEndData.score = score.toFixed(1);
      _gameEndData.description = landingScoreDescription(score);
      _gameEndData.confetti = makeConfetti(state, Math.round(score));
      _angle = Math.PI * 2;
      _velocity = {
        x: 0,
        y: 0,
      };
      _rotationVelocity = 0;
    } else {
      const score = scoreCrash(
        getAngleDeltaUpright(_angle),
        getVectorVelocity(_velocity)
      );
      _gameEndData.score = score.toFixed(1);
      _gameEndData.description = crashScoreDescription(score);
      _gameEndData.explosion = makeExplosion(
        state,
        _position,
        _velocity,
        _angle
      );
    }
    onGameEnd(_gameEndData);
  };
  const _updateProps = (timeSinceStart) => {
    _position.y = Math.min(_position.y + _velocity.y, _groundedHeight);
    if (_position.y < _groundedHeight) {
      if (_rotatingRight) _rotationVelocity += 0.01;
      if (_rotatingLeft) _rotationVelocity -= 0.01;
      if (_position.x < 0) {
        _position.x = canvasWidth;
        onResetXPos();
      }
      if (_position.x > canvasWidth) {
        _position.x = 0;
        onResetXPos();
      }
      _position.x += _velocity.x;
      _angle += (Math.PI / 180) * _rotationVelocity;
      _velocity.y += GRAVITY;
      if (_engineOn) {
        _velocity.x += _thrust * Math.sin(_angle);
        _velocity.y -= _thrust * Math.cos(_angle);
      }
      const rotations = Math.floor(_angle / (Math.PI * 2));
      if (
        Math.abs(_angle - _lastRotationAngle) > Math.PI * 2 &&
        (rotations > _lastRotation || rotations < _lastRotation)
      ) {
        _rotationCount++;
        _lastRotation = rotations;
        _lastRotationAngle = _angle;
        _flipConfetti.push(makeConfetti(state, 10, _position, _velocity));
      }
      if (_position.y < _maxHeight) _maxHeight = _position.y;
      if (getVectorVelocity(_velocity) > getVectorVelocity(_maxVelocity)) {
        _maxVelocity = {
          ..._velocity,
        };
      }
      if (!_engineUsedPreviousFrame && _engineOn) {
        _engineUsed++;
        _engineUsedPreviousFrame = true;
      } else if (_engineUsedPreviousFrame && !_engineOn) {
        _engineUsedPreviousFrame = false;
      }
      if (!_boostersUsedPreviousFrame && (_rotatingLeft || _rotatingRight)) {
        _boostersUsed++;
        _boostersUsedPreviousFrame = true;
      } else if (
        _boostersUsedPreviousFrame &&
        !_rotatingLeft &&
        !_rotatingRight
      ) {
        _boostersUsedPreviousFrame = false;
      }
      if (getVectorVelocity(_velocity) > 20 && !_babySoundPlayed) {
        state.get("audioManager").playBaby();
        _babySoundPlayed = true;
      } else if (getVectorVelocity(_velocity) < 20 && _babySoundPlayed) {
        _babySoundPlayed = false;
      }
    } else if (!_gameEndData) {
      _setGameEndData(
        getVectorVelocity(_velocity) < 0.6 && getAngleDeltaUpright(_angle) < 11,
        timeSinceStart
      );
    }
  };
  const _drawHUD = () => {
    const textWidth = CTX.measureText("100.0 MPH").width + 2;
    const staticPosition = getVectorVelocity(_velocity) > 7;
    const xPosBasis = staticPosition
      ? canvasWidth / 2 - textWidth / 2
      : Math.min(_position.x + 20 * 2, canvasWidth - textWidth);
    const yPosBasis = Math.max(_position.y, 30);
    const rotatingLeft = _rotationVelocity < 0;
    Stats.rotationalVelocity = _rotationVelocity;
    const speedColor =
      getVectorVelocity(_velocity) > 0.6 ? "rgb(255, 0, 0)" : "rgb(0, 255, 0)";
    const angleColor =
      getAngleDeltaUpright(_angle) > 11 ? "rgb(255, 0, 0)" : "rgb(0, 255, 0)";
    CTX.save();
    CTX.fillStyle = speedColor;
    CTX.fillText(`${velocityInMPH(_velocity)} MPH`, xPosBasis, yPosBasis - 14);
    Stats.position = _position;
    Stats.velocity = _velocity;
    CTX.fillStyle = angleColor;
    CTX.fillText(
      `${getAngleDeltaUprightWithSign(_angle).toFixed(1)}°`,
      xPosBasis,
      yPosBasis
    );
    Stats.angle = _angle;
    CTX.fillStyle = "#ffffff";
    CTX.fillText(
      `${heightInFeet(_position.y, _groundedHeight)} FT`,
      xPosBasis,
      yPosBasis + 14
    );
    window.height = _position.y;
    CTX.restore();
    const arrowVerticalOffset = -3;
    if (rotatingLeft) {
      CTX.save();
      CTX.strokeStyle = angleColor;
      CTX.beginPath();
      CTX.moveTo(xPosBasis - 6 - 3, yPosBasis + arrowVerticalOffset);
      CTX.lineTo(xPosBasis - 3, yPosBasis + arrowVerticalOffset - 7 / 2);
      CTX.lineTo(xPosBasis - 3, yPosBasis + arrowVerticalOffset + 7 / 2);
      CTX.closePath();
      CTX.stroke();
      CTX.restore();
    } else {
      CTX.save();
      CTX.strokeStyle = angleColor;
      CTX.beginPath();
      CTX.moveTo(xPosBasis - 6 - 3, yPosBasis + arrowVerticalOffset - 7 / 2);
      CTX.lineTo(xPosBasis - 3, yPosBasis + arrowVerticalOffset);
      CTX.lineTo(xPosBasis - 6 - 3, yPosBasis + arrowVerticalOffset + 7 / 2);
      CTX.closePath();
      CTX.stroke();
      CTX.restore();
    }
  };
  const _drawLander = () => {
    CTX.save();
    CTX.fillStyle = drawLanderGradient(CTX);
    CTX.translate(_position.x, _position.y);
    CTX.rotate(_angle);
    CTX.beginPath();
    CTX.moveTo(-20 / 2, -40 / 2);
    CTX.lineTo(0, -40);
    CTX.lineTo(20 / 2, -40 / 2);
    CTX.lineTo(20 / 2, 40 / 2);
    CTX.lineTo(-20 / 2, 40 / 2);
    CTX.closePath();
    CTX.fill();
    CTX.translate(-20 / 2, -40 / 2);
    if (_engineOn || _rotatingLeft || _rotatingRight) {
      CTX.fillStyle = randomBool() ? "#415B8C" : "#F3AFA3";
    }
    if (_engineOn) {
      const _flameHeight = randomBetween(10, 50);
      CTX.beginPath();
      CTX.moveTo(3, 40);
      CTX.lineTo(20 - 3, 40);
      CTX.lineTo(20 / 2, 40 + _flameHeight);
      CTX.closePath();
      CTX.fill();
    }
    const _boosterLength = randomBetween(5, 25);
    if (_rotatingLeft) {
      CTX.beginPath();
      CTX.moveTo(20, 0);
      CTX.lineTo(20 + _boosterLength, 40 * 0.05);
      CTX.lineTo(20, 40 * 0.1);
      CTX.closePath();
      CTX.fill();
    }
    if (_rotatingRight) {
      CTX.beginPath();
      CTX.moveTo(0, 0);
      CTX.lineTo(-_boosterLength, 40 * 0.05);
      CTX.lineTo(0, 40 * 0.1);
      CTX.closePath();
      CTX.fill();
    }
    CTX.restore();
    if (_position.y < 0) {
      CTX.save();
      CTX.fillStyle = "white";
      CTX.beginPath();
      CTX.moveTo(_position.x, 1);
      CTX.lineTo(_position.x + 6, 9);
      CTX.lineTo(_position.x - 6, 9);
      CTX.closePath();
      CTX.fill();
      CTX.restore();
    }
  };
  const draw = (timeSinceStart) => {
    _updateProps(timeSinceStart);
    if (true || (!_engineOn && !_rotatingLeft && !_rotatingRight)) {
      drawTrajectory(
        state,
        _position,
        _angle,
        _velocity,
        _rotationVelocity,
        _groundedHeight
      );
    }
    if (_flipConfetti.length > 0) _flipConfetti.forEach((c) => c.draw());
    if (_gameEndData) {
      if (_gameEndData.landed) {
        _gameEndData.confetti.draw();
        _drawLander();
      } else {
        _gameEndData.explosion.draw();
      }
    } else {
      _drawLander();
    }
    _drawHUD();
  };
  return {
    draw,
    resetProps,
    engineOn: () => (_engineOn = true),
    engineOff: () => (_engineOn = false),
    rotateLeft: () => (_rotatingLeft = true),
    rotateRight: () => (_rotatingRight = true),
    stopLeftRotation: () => (_rotatingLeft = false),
    stopRightRotation: () => (_rotatingRight = false),
  };
};
const makeToyLander = (
  state,
  onEngineOn,
  onLeftRotation,
  onRightRotation,
  onEngineAndRotation
) => {
  const CTX = state.get("CTX");
  const canvasWidth = state.get("canvasWidth");
  const canvasHeight = state.get("canvasHeight");
  const _toyLanderWidth = Math.min(canvasWidth, canvasHeight) / 7;
  const _toyLanderHeight = _toyLanderWidth * 2;
  Stats.landerHeight = _toyLanderHeight;
  const _toyLanderBoosterLengthMin = _toyLanderWidth / 4;
  const _toyLanderBoosterLengthMax = _toyLanderWidth * 1.25;
  const _toyLanderEngineLengthMin = _toyLanderHeight / 4;
  const _toyLanderEngineLengthMax = _toyLanderHeight * 1.25;
  let _position = {
    x: canvasWidth / 2,
    y: canvasHeight / 2,
  };
  let _rotationVelocity = 0;
  let _angle = Math.PI * 2;
  let _engineOn = false;
  let _rotatingLeft = false;
  let _rotatingRight = false;
  const engineOn = () => {
    _engineOn = true;
    onEngineOn();
  };
  const rotateLeft = () => {
    _rotatingLeft = true;
    onLeftRotation();
  };
  const rotateRight = () => {
    _rotatingRight = true;
    onRightRotation();
  };
  const draw = () => {
    if ((_engineOn && _rotatingLeft) || (_engineOn && _rotatingRight)) {
      onEngineAndRotation();
    }
    if (_rotatingRight) _rotationVelocity += 0.01;
    if (_rotatingLeft) _rotationVelocity -= 0.01;
    _angle += (Math.PI / 180) * _rotationVelocity;
    CTX.save();
    CTX.fillStyle = drawLanderGradient(CTX, _toyLanderWidth);
    CTX.translate(_position.x, _position.y);
    CTX.rotate(_angle);
    CTX.beginPath();
    CTX.moveTo(-_toyLanderWidth / 2, -_toyLanderHeight / 2);
    CTX.lineTo(0, -(_toyLanderHeight * 0.9));
    CTX.lineTo(_toyLanderWidth / 2, -_toyLanderHeight / 2);
    CTX.lineTo(_toyLanderWidth / 2, _toyLanderHeight / 2);
    CTX.lineTo(-_toyLanderWidth / 2, _toyLanderHeight / 2);
    CTX.closePath();
    CTX.fill();
    CTX.translate(-_toyLanderWidth / 2, -_toyLanderHeight / 2);
    if (_engineOn || _rotatingLeft || _rotatingRight) {
      CTX.fillStyle = randomBool() ? "#415B8C" : "#F3AFA3";
    }
    if (_engineOn) {
      const _flameHeight = randomBetween(
        _toyLanderEngineLengthMin,
        _toyLanderEngineLengthMax
      );
      const _flameMargin = _toyLanderWidth / 6;
      CTX.beginPath();
      CTX.moveTo(_flameMargin, _toyLanderHeight);
      CTX.lineTo(_toyLanderWidth - _flameMargin, _toyLanderHeight);
      CTX.lineTo(_toyLanderWidth / 2, _toyLanderHeight + _flameHeight);
      CTX.closePath();
      CTX.fill();
    }
    const _boosterLength = randomBetween(
      _toyLanderBoosterLengthMin,
      _toyLanderBoosterLengthMax
    );
    if (_rotatingLeft) {
      CTX.beginPath();
      CTX.moveTo(_toyLanderWidth, 0);
      CTX.lineTo(_toyLanderWidth + _boosterLength, _toyLanderHeight * 0.05);
      CTX.lineTo(_toyLanderWidth, _toyLanderHeight * 0.1);
      CTX.closePath();
      CTX.fill();
    }
    if (_rotatingRight) {
      CTX.beginPath();
      CTX.moveTo(0, 0);
      CTX.lineTo(-_boosterLength, _toyLanderHeight * 0.05);
      CTX.lineTo(0, _toyLanderHeight * 0.1);
      CTX.closePath();
      CTX.fill();
    }
    CTX.restore();
  };
  return {
    draw,
    engineOn,
    engineOff: () => (_engineOn = false),
    rotateLeft,
    rotateRight,
    stopLeftRotation: () => (_rotatingLeft = false),
    stopRightRotation: () => (_rotatingRight = false),
  };
};
const makeStarfield = (state) => {
  const CTX = state.get("CTX");
  const canvasWidth = state.get("canvasWidth");
  const canvasHeight = state.get("canvasHeight");
  let stars = [];
  const reGenerate = () => {
    stars = [];
    const volume = (canvasWidth * canvasHeight) / 6000;
    for (let index = 0; index < volume; index++) {
      stars.push({
        size: randomBetween(0.5, 1.5),
        opacity: randomBetween(0.1, 1),
        position: {
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
        },
      });
    }
  };
  reGenerate();
  const draw = () => {
    CTX.save();
    stars.forEach((star) => {
      CTX.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      CTX.beginPath();
      CTX.arc(star.position.x, star.position.y, star.size, 0, Math.PI * 2);
      CTX.closePath();
      CTX.fill();
    });
    CTX.restore();
  };
  return {
    draw,
    reGenerate,
  };
};
const makeControls = (state, lander, audioManager) => {
  const CTX = state.get("CTX");
  const canvasWidth = state.get("canvasWidth");
  const canvasHeight = state.get("canvasHeight");
  const canvasElement = state.get("canvasElement");
  const allActiveTouches = new Set();
  const touchColumnMap = ["left", "center", "center", "right"];
  let showCenterOverlay = false;
  let showRightOverlay = false;
  let showLeftOverlay = false;
  let hasKeyboard = false;
  function onKeyDown({ key }) {
    if (key === "w" || key === "ArrowUp") {
      lander.engineOn();
      audioManager.playEngineSound();
    }
    if (key === "a" || key === "ArrowLeft") {
      lander.rotateLeft();
      audioManager.playBoosterSound1();
    }
    if (key === "d" || key === "ArrowRight") {
      lander.rotateRight();
      audioManager.playBoosterSound2();
    }
    hasKeyboard = true;
  }
  function onKeyUp({ key }) {
    if (key === "w" || key === "ArrowUp") {
      lander.engineOff();
      audioManager.stopEngineSound();
    }
    if (key === "a" || key === "ArrowLeft") {
      lander.stopLeftRotation();
      audioManager.stopBoosterSound1();
    }
    if (key === "d" || key === "ArrowRight") {
      lander.stopRightRotation();
      audioManager.stopBoosterSound2();
    }
  }
  const activateTouchZone = (zoneName) => {
    if (zoneName === "left") {
      lander.rotateLeft();
      audioManager.playBoosterSound1();
      showLeftOverlay = true;
    } else if (zoneName === "center") {
      lander.engineOn();
      audioManager.playEngineSound();
      showCenterOverlay = true;
    } else {
      lander.rotateRight();
      audioManager.playBoosterSound2();
      showRightOverlay = true;
    }
  };
  const deactivateTouchZone = (zoneName) => {
    if (zoneName === "left") {
      lander.stopLeftRotation();
      audioManager.stopBoosterSound1();
      showLeftOverlay = false;
    } else if (zoneName === "center") {
      lander.engineOff();
      audioManager.stopEngineSound();
      showCenterOverlay = false;
    } else {
      lander.stopRightRotation();
      audioManager.stopBoosterSound2();
      showRightOverlay = false;
    }
  };
  const getTouchZone = (x) => {
    const clampedColumnNumber = Math.max(
      0,
      Math.min(
        Math.floor(x / (canvasWidth / touchColumnMap.length)),
        touchColumnMap.length
      )
    );
    return touchColumnMap[clampedColumnNumber];
  };
  const getColumnBoundary = (colName) => {
    const start =
      touchColumnMap.findIndex((e) => e === colName) / touchColumnMap.length;
    const end =
      (touchColumnMap.findLastIndex((e) => e === colName) + 1) /
      touchColumnMap.length;
    return {
      startPixel: start * canvasWidth,
      widthInPixels: (end - start) * canvasWidth,
    };
  };
  function onTouchStart(e) {
    for (let index = 0; index < e.changedTouches.length; index++) {
      activateTouchZone(getTouchZone(e.changedTouches[index].clientX));
      allActiveTouches.add(e.changedTouches[index]);
    }
    if (e.cancelable) e.preventDefault();
  }
  function onTouchMove(e) {
    for (let index = 0; index < e.changedTouches.length; index++) {
      let touchPreviousData;
      allActiveTouches.forEach((touch) => {
        if (touch.identifier === e.changedTouches[index].identifier) {
          touchPreviousData = touch;
        }
      });
      if (touchPreviousData) {
        const previousTouchZone = getTouchZone(touchPreviousData.clientX);
        const currentTouchZone = getTouchZone(e.changedTouches[index].clientX);
        if (previousTouchZone !== currentTouchZone) {
          deactivateTouchZone(previousTouchZone);
          activateTouchZone(currentTouchZone);
          allActiveTouches.delete(touchPreviousData);
          allActiveTouches.add(e.changedTouches[index]);
        }
      } else {
        activateTouchZone(getTouchZone(e.changedTouches[index].clientX));
        allActiveTouches.add(e.changedTouches[index]);
      }
    }
    if (e.cancelable) e.preventDefault();
  }
  function onTouchEnd(e) {
    for (let index = 0; index < e.changedTouches.length; index++) {
      deactivateTouchZone(getTouchZone(e.changedTouches[index].clientX));
      allActiveTouches.forEach((touch) => {
        if (touch.identifier === e.changedTouches[index].identifier) {
          allActiveTouches.delete(touch);
        }
      });
    }
    if (e.cancelable) e.preventDefault();
  }
  const attachEventListeners = () => {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    canvasElement.addEventListener("touchstart", onTouchStart);
    canvasElement.addEventListener("touchmove", onTouchMove);
    canvasElement.addEventListener("touchend", onTouchEnd);
  };
  const detachEventListeners = () => {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    canvasElement.removeEventListener("touchstart", onTouchStart);
    canvasElement.removeEventListener("touchmove", onTouchMove);
    canvasElement.removeEventListener("touchend", onTouchEnd);
  };
  const drawTouchOverlay = () => {
    CTX.save();
    CTX.fillStyle = "rgba(255, 255, 255, 0.07)";
    if (showLeftOverlay) {
      const { startPixel, widthInPixels } = getColumnBoundary("left");
      CTX.fillRect(startPixel, 0, widthInPixels, canvasHeight);
    }
    if (showCenterOverlay) {
      const { startPixel, widthInPixels } = getColumnBoundary("center");
      CTX.fillRect(startPixel, 0, widthInPixels, canvasHeight);
    }
    if (showRightOverlay) {
      const { startPixel, widthInPixels } = getColumnBoundary("right");
      CTX.fillRect(startPixel, 0, widthInPixels, canvasHeight);
    }
    CTX.restore();
  };
  return {
    drawTouchOverlay,
    attachEventListeners,
    detachEventListeners,
    getHasKeyboard: () => hasKeyboard,
  };
};
const makeTerrain = (state) => {
  const CTX = state.get("CTX");
  const canvasWidth = state.get("canvasWidth");
  const canvasHeight = state.get("canvasHeight");
  const points = Math.max(canvasWidth / 60, 20);
  let terrain = [];
  const reGenerate = () => {
    terrain = [];
    for (let index = 1; index < points; index++) {
      terrain.push({
        x: index * (canvasWidth / points),
        y: randomBetween(canvasHeight - 5, canvasHeight - 10),
      });
    }
  };
  reGenerate();
  const draw = () => {
    CTX.save();
    CTX.fillStyle = "#A2A4A1";
    CTX.beginPath();
    CTX.moveTo(0, canvasHeight);
    CTX.lineTo(0, canvasHeight - 10 / 2);
    terrain.forEach((point) => {
      CTX.lineTo(point.x, point.y);
    });
    CTX.lineTo(canvasWidth, canvasHeight - 10 / 2);
    CTX.lineTo(canvasWidth, canvasHeight);
    CTX.closePath();
    CTX.fill();
    CTX.restore();
  };
  return {
    draw,
    reGenerate,
  };
};
const showStatsAndResetControl = (
  lander,
  animationObject,
  data,
  hasKeyboard
) => {
  const canShowShareSheet = navigator.canShare;
  const showStats = () => {
    document.querySelector("#endGameStats").classList.add("show");
    document.querySelector("#reset").classList.add("loading");
  };
  const canCopyText = navigator && navigator.clipboard;
  const shareText = `${data.description}

Score: ${data.score} point ${data.landed ? "landing" : "crash"}
Speed: ${data.speed}mph
Angle: ${data.angle}°
Time: ${data.durationInSeconds} seconds
Flips: ${data.rotations}
Max speed: ${data.maxSpeed}mph
Max height: ${data.maxHeight}ft
Engine used: ${data.engineUsed} times
Boosters used: ${data.boostersUsed} times
https://ehmorris.com/lander/`;
  const hideStats = () => {
    document
      .querySelector("#endGameStats .buttonContainer")
      .classList.remove("show");
    document.querySelector("#endGameStats").classList.remove("show");
  };
  const populateMeter = (name, percentPosition, textValue) => {
    const meter = document.querySelector(`[data-stat-name="${name}"]`);
    meter.querySelector("[data-value]").textContent = textValue;
    setTimeout(() => {
      meter.querySelector(
        "[data-percent-position]"
      ).style.left = `${percentPosition}%`;
    }, 0);
  };
  const resetMeter = (name) => {
    const meter = document.querySelector(`[data-stat-name="${name}"]`);
    meter.querySelector("[data-value]").textContent = "";
    meter.querySelector("[data-percent-position]").style.left = `0`;
  };
  const populateStats = (data) => {
    document.querySelector("#description").textContent = data.description;
    document.querySelector("#score").textContent = data.score;
    document.querySelector("#type").textContent = data.landed
      ? "landing"
      : "crash";
    populateMeter("speed", data.speedPercent, data.speed);
    populateMeter("angle", data.anglePercent, data.angle);
    document.querySelector("#duration").textContent = data.durationInSeconds;
    document.querySelector("#rotations").textContent = data.rotations;
    document.querySelector("#maxSpeed").textContent = data.maxSpeed;
    document.querySelector("#maxHeight").textContent = data.maxHeight;
    document.querySelector("#engineUsed").textContent = data.engineUsed;
    document.querySelector("#boostersUsed").textContent = data.boostersUsed;
    if (hasKeyboard) {
      document.querySelector("#resetText").textContent = "Reset (Spacebar)";
    }
    if (canShowShareSheet) {
      if (document.querySelector("#copyText")) {
        document.querySelector("#copyText").remove();
      }
    } else if (document.querySelector("#share")) {
      document.querySelector("#share").remove();
    }
    if (!canCopyText && document.querySelector("#copyText")) {
      document.querySelector("#copyText").remove();
    }
  };
  function showShareSheet() {
    try {
      navigator.share({
        text: shareText,
      });
    } catch {}
  }
  function copyShareStats() {
    try {
      navigator.clipboard.writeText(shareText);
    } catch {}
  }
  function resetOnSpace({ code }) {
    if (code === "Space") resetGame();
  }
  const attachEventListeners = () => {
    setTimeout(() => {
      document.querySelector("#reset").classList.remove("loading");
      document.querySelector("#reset").addEventListener("click", resetGame);
    }, 1500);
    if (canShowShareSheet) {
      document
        .querySelector("#share")
        .addEventListener("click", showShareSheet);
    } else if (canCopyText) {
      document
        .querySelector("#copyText")
        .addEventListener("click", copyShareStats);
    }
    if (hasKeyboard) {
      setTimeout(() => {
        document.addEventListener("keydown", resetOnSpace);
      }, 1500);
    }
  };
  const detachEventListeners = () => {
    document.querySelector("#reset").removeEventListener("click", resetGame);
    if (canShowShareSheet) {
      document
        .querySelector("#share")
        .removeEventListener("click", showShareSheet);
    }
    if (hasKeyboard) {
      document.removeEventListener("keydown", resetOnSpace);
    }
  };
  function resetGame() {
    lander.resetProps();
    animationObject.resetStartTime();
    resetMeter("speed");
    resetMeter("angle");
    hideStats();
    detachEventListeners();
  }
  populateStats(data);
  showStats();
  attachEventListeners();
};
const manageInstructions = (onCloseInstructions) => {
  let _engineDone = false;
  let _leftRotationDone = false;
  let _rightRotationDone = false;
  let _engineAndRotationDone = false;
  let _hasClosedInstructionsVar = (() => {
    try {
      return localStorage.getItem("closedInstructions");
    } catch {
      return false;
    }
  })();
  const likelyTouchDevice = window.matchMedia("(any-pointer: coarse)").matches;
  const show = () => {
    document.querySelector("#instructions").classList.add("show");
    document.querySelector("#crashSpeed").textContent = `${
      CRASH_VELOCITY * VELOCITY_MULTIPLIER
    } MPH`;
    document.querySelector("#crashAngle").textContent = `${CRASH_ANGLE}°`;
    if (likelyTouchDevice) {
      document.querySelector("#forKeyboard").remove();
    } else {
      document.querySelector("#forTouch").remove();
    }
  };
  function close() {
    if (!_hasClosedInstructionsVar) {
      document.querySelector("#instructions").classList.remove("show");
      try {
        localStorage.setItem("closedInstructions", true);
      } catch {}
      _hasClosedInstructionsVar = true;
      onCloseInstructions();
    }
  }
  const checkDone = () => {
    if (
      _engineDone &&
      _leftRotationDone &&
      _rightRotationDone &&
      _engineAndRotationDone
    ) {
      const closeTimeout = () => setTimeout(close, 1000);
      const options = {
        once: true,
      };
      document.addEventListener("touchend", closeTimeout, options);
      document.addEventListener("keyup", closeTimeout, options);
    }
  };
  const setEngineDone = () => {
    _engineDone = true;
    document.querySelector("#engineCheck").classList.add("strikethrough");
    checkDone();
  };
  const setLeftRotationDone = () => {
    _leftRotationDone = true;
    document
      .querySelector("#rightRotationCheck")
      .classList.add("strikethrough");
    checkDone();
  };
  const setRightRotationDone = () => {
    _rightRotationDone = true;
    document.querySelector("#leftRotationCheck").classList.add("strikethrough");
    checkDone();
  };
  const setEngineAndRotationDone = () => {
    _engineAndRotationDone = true;
    document
      .querySelector("#engineAndRotationCheck")
      .classList.add("strikethrough");
    checkDone();
  };
  return {
    show,
    hasClosedInstructions: () => _hasClosedInstructionsVar,
    setEngineDone,
    setLeftRotationDone,
    setRightRotationDone,
    setEngineAndRotationDone,
  };
};
const makeAudioManager = () => {
  let hasInitialized = false;
  let audioCTX;
  let engineFileBuffer;
  let boosterFileBuffer;
  let crash1FileBuffer;
  let crash2FileBuffer;
  let landing1FileBuffer;
  let landing2FileBuffer;
  let confetti1FileBuffer;
  let confetti2FileBuffer;
  let babyFileBuffer;
  let themeAudio;
  let engineFileBufferSource = false;
  let booster1FileBufferSource = false;
  let booster2FileBufferSource = false;
  async function _loadFile(context, filePath) {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    return audioBuffer;
  }
  const _initialize = (e) => {
    if (!hasInitialized) {
      hasInitialized = true;
      audioCTX = new AudioContext();
      let base = "https://ehmorris.com/lander/";
      engineFileBuffer = _loadFile(audioCTX, base + "audio/engine.mp3");
      boosterFileBuffer = _loadFile(audioCTX, base + "audio/booster.mp3");
      crash1FileBuffer = _loadFile(audioCTX, base + "audio/crash1.mp3");
      crash2FileBuffer = _loadFile(audioCTX, base + "audio/crash2.mp3");
      landing1FileBuffer = _loadFile(audioCTX, base + "audio/landing1.mp3");
      landing2FileBuffer = _loadFile(audioCTX, base + "audio/landing2.mp3");
      confetti1FileBuffer = _loadFile(audioCTX, base + "audio/confetti1.mp3");
      confetti2FileBuffer = _loadFile(audioCTX, base + "audio/confetti2.mp3");
      babyFileBuffer = _loadFile(audioCTX, base + "audio/baby.mp3");
      themeAudio = new Audio(base + "audio/theme.mp3");
      themeAudio.loop = true;
      themeAudio.play();
    }
  };
  document.addEventListener("touchend", _initialize, {
    once: true,
  });
  document.addEventListener(
    "keydown",
    ({ isTrusted, metaKey, shiftKey, ctrlKey, altKey, key }) => {
      if (
        isTrusted &&
        !(metaKey || shiftKey || ctrlKey || altKey) &&
        key !== "Escape" &&
        key !== "Esc"
      ) {
        _initialize();
      }
    },
    {
      once: true,
    }
  );
  document.addEventListener("visibilitychange", () => {
    if (themeAudio) {
      document.hidden ? themeAudio.pause() : themeAudio.play();
    }
  });
  async function _playTrack(audioBuffer, loop = true) {
    const playBuffer = (buffer) => {
      const trackSource = new AudioBufferSourceNode(audioCTX, {
        buffer: buffer,
        loop: loop,
      });
      trackSource.connect(audioCTX.destination);
      trackSource.start();
      return trackSource;
    };
    if (hasInitialized) {
      return Promise.all([audioCTX.resume(), audioBuffer]).then((e) =>
        playBuffer(e[1])
      );
    } else {
      return Promise.all([_initialize(), audioBuffer]).then((e) =>
        playBuffer(e[1])
      );
    }
  }
  const playEngineSound = () => {
    if (!engineFileBufferSource) {
      engineFileBufferSource = _playTrack(engineFileBuffer);
    }
  };
  const playBoosterSound1 = () => {
    if (!booster1FileBufferSource) {
      booster1FileBufferSource = _playTrack(boosterFileBuffer);
    }
  };
  const playBoosterSound2 = () => {
    if (!booster2FileBufferSource) {
      booster2FileBufferSource = _playTrack(boosterFileBuffer);
    }
  };
  const stopEngineSound = () => {
    if (engineFileBufferSource) {
      engineFileBufferSource.then((e) => {
        e.stop();
        engineFileBufferSource = false;
      });
    }
  };
  const stopBoosterSound1 = () => {
    if (booster1FileBufferSource) {
      booster1FileBufferSource.then((e) => {
        e.stop();
        booster1FileBufferSource = false;
      });
    }
  };
  const stopBoosterSound2 = () => {
    if (booster2FileBufferSource) {
      booster2FileBufferSource.then((e) => {
        e.stop();
        booster2FileBufferSource = false;
      });
    }
  };
  const playCrash = () => {
    _playTrack(randomBool() ? crash1FileBuffer : crash2FileBuffer, false);
  };
  const playLanding = () => {
    _playTrack(randomBool() ? landing1FileBuffer : landing2FileBuffer, false);
  };
  const playConfetti = () => {
    _playTrack(randomBool() ? confetti1FileBuffer : confetti2FileBuffer, false);
  };
  const playBaby = () => {
    _playTrack(babyFileBuffer, false);
  };
  return {
    playEngineSound,
    playBoosterSound1,
    playBoosterSound2,
    stopEngineSound,
    stopBoosterSound1,
    stopBoosterSound2,
    playCrash,
    playLanding,
    playConfetti,
    playBaby,
  };
};
const makeStateManager = () => {
  const state = new Map();
  return state;
};
const makeTallyManger = () => {
  let _landingTotal = 0;
  let _crashTotal = 0;
  const getLandingTotalStorage = () => {
    try {
      return localStorage.getItem("landingTotal")
        ? localStorage.getItem("landingTotal")
        : 0;
    } catch {
      return _landingTotal;
    }
  };
  const getCrashTotalStorage = () => {
    try {
      return localStorage.getItem("crashTotal")
        ? localStorage.getItem("crashTotal")
        : 0;
    } catch {
      return _crashTotal;
    }
  };
  _landingTotal = parseInt(getLandingTotalStorage());
  _crashTotal = parseInt(getCrashTotalStorage());
  const storeLanding = () => {
    _landingTotal++;
    try {
      localStorage.setItem("landingTotal", _landingTotal);
    } catch {}
  };
  const storeCrash = () => {
    _crashTotal++;
    try {
      localStorage.setItem("crashTotal", _crashTotal);
    } catch {}
  };
  const updateDisplay = () => {
    document.querySelector("#landingTotal").textContent =
      getLandingTotalStorage();
    document.querySelector("#crashTotal").textContent = getCrashTotalStorage();
  };
  updateDisplay();
  return {
    storeLanding,
    storeCrash,
    updateDisplay,
  };
};
const audioManager = makeAudioManager();
const [CTX, canvasWidth, canvasHeight, canvasElement] = generateCanvas({
  width: window.innerWidth,
  height: window.innerHeight,
  attachNode: ".game",
});
const appState = makeStateManager()
  .set("CTX", CTX)
  .set("canvasWidth", canvasWidth)
  .set("canvasHeight", canvasHeight)
  .set("canvasElement", canvasElement)
  .set("audioManager", audioManager);
const instructions = manageInstructions(onCloseInstructions);
const toyLander = makeToyLander(
  appState,
  () => instructions.setEngineDone(),
  () => instructions.setLeftRotationDone(),
  () => instructions.setRightRotationDone(),
  () => instructions.setEngineAndRotationDone()
);
window.lander = toyLander;
const toyLanderControls = makeControls(appState, toyLander, audioManager);
const lander = makeLander(appState, onGameEnd, onResetXPos);
const landerControls = makeControls(appState, lander, audioManager);
const stars = makeStarfield(appState);
const terrain = makeTerrain(appState);
const tally = makeTallyManger();
let randomConfetti = [];
if (!instructions.hasClosedInstructions()) {
  instructions.show();
  toyLanderControls.attachEventListeners();
} else {
  landerControls.attachEventListeners();
}
const animationObject = animate((timeSinceStart) => {
  CTX.fillStyle = getComputedStyle(document.body).getPropertyValue(
    "--background-color"
  );
  CTX.fillRect(0, 0, canvasWidth, canvasHeight);
  stars.draw();
  terrain.draw();
  if (instructions.hasClosedInstructions()) {
    landerControls.drawTouchOverlay();
    lander.draw(timeSinceStart);
  } else {
    toyLander.draw();
  }
  if (randomConfetti.length > 0) {
    randomConfetti.forEach((c) => c.draw());
  }
});
function onCloseInstructions() {
  toyLanderControls.detachEventListeners();
  landerControls.attachEventListeners();
}
function onGameEnd(data) {
  showStatsAndResetControl(
    lander,
    animationObject,
    data,
    landerControls.getHasKeyboard()
  );
  if (data.landed) {
    audioManager.playLanding();
    tally.storeLanding();
  } else {
    audioManager.playCrash();
    tally.storeCrash();
  }
  tally.updateDisplay();
  randomConfetti = [];
}
function onResetXPos() {
  stars.reGenerate();
  terrain.reGenerate();
}
document.addEventListener("keydown", ({ key }) => {
  if (key === "c") {
    randomConfetti.push(
      makeConfetti(appState, 10, {
        x: randomBetween(0, canvasWidth),
        y: randomBetween(0, canvasHeight),
      })
    );
  }
});
