/**
 * @fileoverview Particle classes for use with the acid equilibrium simulation.
 * @copyright Carnegie Mellon University 2018
 * @author Meg Richards (mouse@cmu.edu)
 */

/**
 * A generic particle.
 * @class
 * @param {!object} sketch - Parent p5 sketch.
 * @param {number} x=0 - X position of particle.
 * @param {number} y=0 - Y position of particle.
 */
function Particle(sketch,x=0,y=0) {
    /**
     * The parent p5 sketch containing the particle.
     * @type {object}
     */
    this.p = sketch;
    this.createSprite(x,y);
}

/**
 * Collider x position from the center of the sprite.
 * @type {number}
 * @default 0
 */
Particle.prototype.collider_offset_x = 0;

/**
 * Collider y position from the center of the sprite.
 * @type {number}
 * @default 0
 */
Particle.prototype.collider_offset_y = 0;

/**
 * Collider radius for overlap detection between sprites.
 * @type {number}
 * @default 1
 */
Particle.prototype.collider_radius = 1;

/**
 * Relative path of the image for the particle's sprite.
 * @type {string}
 * @default null
 */
Particle.prototype.image_path = null;

/**
 * Maximum for possible velocities of the particle.
 * @type {number}
 * @default 0
 */
Particle.prototype.max_velocity = 0;

/**
 * Particles and their corresponding reactions.
 * @typedef ReactionsHash
 * @property {string} particle_class - The particle type being reacted to.
 * @property {ReactionFunction} reaction - A function performing the reaction.
 * @example
 * {
 *   "Proton":
 *   function(baseSprite,protonSprite) {
 *     console.log("Just hit a Proton!");
 *   },
 * }
 */

/**
 * Defines the reaction between particles.
 * @typedef ReactionFunction
 * @type function
 * @param {object} source_sprite - The source particle sprite.
 * @param {object} target_sprite - The target particle sprite.
 */

/**
 * Reactions a particle will have with other particles.
 * @type {ReactionsHash}
 * @default {}
 */
Particle.prototype.reacts_with = {};

/**
 * Perform any actions required before particles can be created.
 * @function preload
 * @static
 * @memberof Particle
 * @param {object} p - Parent p5 sketch.
 */
Particle.prototype.preload = function(p) {
    /**
     * The image to be used for the particle sprite.
     * @type {object}
     */
    this.image = p.loadImage(this.image_path);
};

/**
 * Creates a corresponding sprite for a particle.
 * @param {number} x=0 - X position for sprite.
 * @param {number} y=0 - Y position for sprite.
 */
Particle.prototype.createSprite = function(x=0,y=0) {
    var p = this.p;
    if( p ) {
        this.sprite = p.createSprite(x,y);
        if( this.image != null )
            this.sprite.addImage("default",this.image);
        this.sprite.setCollider('circle',
                                this.collider_offset_x,
                                this.collider_offset_y,
                                this.collider_radius);
        this.sprite.velocity.x = this.randomVelocity();
        this.sprite.velocity.y = this.randomVelocity();
        this.sprite.particle = this;
    }
};

/**
 * Calculate a random velocity for a particle from [-max_velocity, max_velocity]
 * where max_velocity is the particle's max velocity property.
 * @returns {number} A possibly negative random velocity
 */
Particle.prototype.randomVelocity = function() {
    // Generate a random number [0,2*max_velocity]; then subtract max velocity
    return this.max_velocity - Math.random()*2*this.max_velocity;
};

/**
 * Update this particle during the sketch's draw iteration.
 */
Particle.prototype.update = function(){};


/**
 * A conjugate base particle.
 * @class
 * @augments Particle
 * @param {!object} sketch - Parent p5 sketch.
 * @param {number} x=0 - X position of particle.
 * @param {number} y=0 - Y position of particle.
 */
function ConjugateBase(sketch,x=0,y=0) {
    Particle.call(this,sketch);
    this.createSprite(x,y);

    /**
     * Hash defining a conjugate base's relationship with a proton.
     * @type {object}
     * @property {object} particle - The proton particle, if any, joined to the
     *   conjugate base particle.
     * @property {number} offset_x - X position for the proton from the center
     *   of the conjugate base particle.
     * @property {number} offset_y - Y position for the proton from the center
     *   of the conjugate base particle.
     * @property {number} restore_depth - Original depth/drawing order for
     *   proton. Will be restored after separation.
     * @property {number[]} release_after_range - An array of two numbers, used
     *   as max & min of a random duration in milliseconds for a proton to be
     *   joined.
     * @property {number} post_release_duration - The amount of time in
     *   milliseconds a previously joined proton & conjugate base will be unable
     *   to rejoin with other particles after separation.
     * @property {number} release_after - A time in milliseconds, after which a
     *   proton should be released. A non-null release_after indicates a joined or
     *   recently separated (undergoing post_release_duration) pair of conjugate
     *   base and proton.
     */
    this.proton = {};
    this.proton.particle = null;
    this.proton.offset_x = 10;
    this.proton.offset_y = -10;
    this.proton.restore_depth = null; //TODO
    this.proton.release_after_range = [0,5000];
    this.proton.post_release_duration = 750;
    this.proton.release_after = null;
}
ConjugateBase.prototype = new Particle();

/**
 * Collider radius of a conjugate base.
 * @override
 * @type {number}
 * @default 16
 */
ConjugateBase.prototype.collider_radius = 16;

/**
 * Relative path of the image for a conjugate base.
 * @override
 * @type {string}
 * @default "assets/ConjugateBase_Gray.png"
 */
ConjugateBase.prototype.image_path = 'assets/ConjugateBase_Gray.png';

/**
 * Maximum possible velocity of a conjugate base.
 * @override
 * @type {number}
 * @default .5
 */
ConjugateBase.prototype.max_velocity = .5;

/** @inheritdoc */
ConjugateBase.prototype.reacts_with = {
    "Proton": function(baseSprite,protonSprite) {
        var baseParticle = baseSprite.particle;
        var protonParticle = protonSprite.particle;
        if( !protonParticle.base.particle &&
            !baseParticle.proton.particle ) {
            // Allow base to capture the proton; set random release time
            baseParticle.proton.release_after = Date.now() +
                baseParticle.proton.release_after_range[0] +
                baseParticle.proton.release_after_range[1] * Math.random();
            // Create references between joined particles
            baseParticle.proton.particle = protonParticle;
            protonParticle.base.particle = baseParticle;
            // Preserve original proton drawing order and place just above base
            baseParticle.proton.restore_depth = protonSprite.depth;
            protonSprite.depth = baseSprite.depth+.5;
        }
    },
};

/** @inheritdoc */
ConjugateBase.prototype.update = function() {
    var proton = this.proton;
    if( proton.release_after ) {
        var now = Date.now();
        if( now < proton.release_after ) {
            // Not yet released; update proton location
            var protonSprite = proton.particle.sprite;
            var baseSprite = this.sprite;
            protonSprite.position.x = baseSprite.position.x + this.proton.offset_x;
            protonSprite.position.y = baseSprite.position.y + this.proton.offset_y;
        }
        else if( now < (proton.release_after + proton.post_release_duration) ) {
            // Released; do not update proton location to allow separation
        }
        else {
            // Restore proton's drawing order
            proton.particle.sprite.depth = proton.restore_depth;
            proton.restore_depth = null;
            // Release complete; allow particles to join
            proton.release_after = null;
            proton.particle.base.particle = null;
            proton.particle = null;
        }
    }
};


/**
 * Represents a proton particle
 * @class
 * @augments Particle
 * @param {!object} sketch - Parent sketch
 * @param {number} x=0 - X position of particle
 * @param {number} y=0 - Y position of particle
 */
function Proton(sketch,x=0,y=0) {
    Particle.call(this,sketch);
    this.createSprite(x,y);
    this.base = {};
    this.base.particle = null;
};
Proton.prototype = new Particle();

/**
 * Collider radius of a proton.
 * @override
 * @type {number}
 * @default 6
 */
Proton.prototype.collider_radius = 6;

/**
 * Relative path of the image for a proton.
 * @override
 * @type {string}
 * @default "assets/proton.png"
 */
Proton.prototype.image_path = 'assets/proton.png';

/**
 * Maximum possible velocity of a proton.
 * @override
 * @type {number}
 * @default 3
 */
Proton.prototype.max_velocity = 3;
