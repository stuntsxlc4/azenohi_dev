export const sphereVertex = /* glsl */ `
varying vec2 mapUV;
varying vec3 worldNormal;
varying vec3 worldEast;
void main() {
  mapUV = uv;
  worldNormal = normalize(mat3(modelMatrix) * normal);
  float longitude = uv.x * 6.2831853 - 3.14159265;
  vec3 east = vec3(-sin(longitude),0.,-cos(longitude));
  worldEast = normalize(mat3(modelMatrix) * east);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Convert a tangent-plane direction into equirectangular UV displacement per planet radius.
const tangentUV = /* glsl */ `
vec2 projectedDirection(vec3 direction, vec3 east, vec3 north, float v) {
  return vec2(dot(direction,east)/(6.2831853*max(sin(v*3.14159265),0.02)),
              dot(direction,north)/3.14159265);
}`;

export const surfaceFragment = /* glsl */ `
uniform sampler2D albedoMap;
uniform sampler2D lightsMap;
uniform sampler2D reliefOceanMap;
uniform sampler2D densityMap;
uniform float cloudOffset;
#ifdef REGIONAL_MAPS
uniform sampler2D regionAlbedo;
uniform sampler2D regionLights;
#endif
uniform vec3 sun;
varying vec2 mapUV;
varying vec3 worldNormal;
varying vec3 worldEast;
${tangentUV}
void main() {
  vec3 radial = normalize(worldNormal);
  vec3 east = normalize(worldEast);
  vec3 north = normalize(cross(radial,east));
  vec3 packedData = texture2D(reliefOceanMap,mapUV).rgb;
  float water = smoothstep(0.03,0.97,packedData.b);
  vec2 slope = (packedData.rg - vec2(128./255.)) * 0.8;
  vec3 n = normalize(radial + (1.-water)*(east*slope.x + north*slope.y));
  vec3 viewRay = normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));
  float mu = dot(radial,sun);
  float daylight = smoothstep(-0.16,0.12,mu);
  float illumination = max(dot(n,sun),0.0);
  vec3 albedo = texture2D(albedoMap,mapUV).rgb;
  float electricity = texture2D(lightsMap,mapUV).r;
  #ifdef REGIONAL_MAPS
    // Same geographic UVs as the global mosaic. Blend satellite color in linear
    // space across the footprint boundary as Europe rotates into and out of view.
    vec2 degrees = mapUV * vec2(360.,180.) - vec2(180.,90.);
    vec2 localUV = (degrees - vec2(-16.,33.)) / vec2(40.,30.);
    vec2 edge = min(localUV,1.-localUV);
    float weight = smoothstep(0.,.045,min(edge.x,edge.y));
    albedo = mix(albedo,texture2D(regionAlbedo,localUV).rgb,weight);
    // VIIRS is a display-referred night composite. Undo its brightened lower
    // tones before using it as an emission field, preserving distinct street clusters.
    float viirs = texture2D(regionLights,localUV).r;
    electricity = mix(electricity,pow(viirs,1.86),weight);
  #endif

  // Trace the solar direction through the elevated cloud sphere. Shadow coordinates
  // use the actual longitude difference between the two independently rotating meshes.
  vec2 alongSun = projectedDirection(sun,east,north,mapUV.y);
  float rayToCloud = sqrt(max(mu,0.)*max(mu,0.)+0.00174)-max(mu,0.);
  float cloudDensity = texture2D(densityMap,mapUV+vec2(cloudOffset,0.)+alongSun*rayToCloud).r;
  float transmittance = exp(-2.0 * cloudDensity * cloudDensity);
  vec3 solarIrradiance = 2.4 * exp(-vec3(.036,.061,.104) / max(.036,mu));
  vec3 direct = illumination * transmittance * solarIrradiance;
  float dusk = smoothstep(-.42,.15,mu);
  vec3 sky = mix(vec3(.12,.17,.28),vec3(.50,.59,.69),dusk);
  // The diffuse sky over unlit land is comparatively achromatic at dusk.
  vec3 nightAlbedo = mix(albedo,vec3(dot(albedo,vec3(.2126,.7152,.0722))),.30*(1.-water));
  vec3 ground = mix(nightAlbedo,albedo,daylight) * sky + albedo * direct;

  // Dielectric Fresnel + a rough-ocean microfacet lobe restricted to measured water.
  float noV = max(dot(radial,viewRay),0.);
  float fresnelSky = 0.020+0.98*pow(1.-noV,5.);
  vec3 halfVector = normalize(viewRay+sun);
  float noH = max(dot(radial,halfVector),0.);
  float alpha2 = 0.012;
  float denominator = noH*noH*(alpha2-1.)+1.;
  float distribution = alpha2/(3.14159265*denominator*denominator);
  // Schlick Fresnel for air/water (IOR 1.333) and height-correlated Smith GGX
  // visibility. The visibility term includes the microfacet BRDF denominator.
  float noL = max(mu,0.);
  float voH = clamp(dot(viewRay,halfVector),0.,1.);
  float fresnelSun = 0.0204 + 0.9796*pow(1.-voH,5.);
  float lambdaV = noL*sqrt(alpha2 + (1.-alpha2)*noV*noV);
  float lambdaL = noV*sqrt(alpha2 + (1.-alpha2)*noL*noL);
  float visibility = 0.5/max(lambdaV+lambdaL,0.0001);
  // Extinction along the grazing incident ray warms and attenuates the reflected beam.
  vec3 solarBeam = 0.88 * exp(-vec3(.043,.087,.178)/max(.030,noL));
  vec3 glint = solarBeam*noL*distribution*fresnelSun*visibility*transmittance;
  ground += water * (vec3(.043,.109,.231)*fresnelSky + glint);

  // The VIIRS radiance field supplies every light. Transmission through the
  // moving deck is applied afterwards by the independently composited cloud pass.
  vec3 cityRadiance = mix(vec3(1.82,.64,.20),vec3(2.36,1.35,.62),
                          smoothstep(.20,.82,electricity));
  ground += pow(electricity,1.22) * cityRadiance * (1.-daylight);
  gl_FragColor = vec4(ground,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const cloudFragment = /* glsl */ `
uniform sampler2D densityMap;
uniform vec3 sun;
varying vec2 mapUV;
varying vec3 worldNormal;
varying vec3 worldEast;
${tangentUV}

void main() {
  vec3 n = normalize(worldNormal);
  vec3 east = normalize(worldEast);
  vec3 north = normalize(cross(n,east));
  vec3 viewRay = normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2]));
  float mu = dot(n,sun);
  float noV = max(0.,dot(n,viewRay));
  // Sample the same georeferenced density field at different heights between
  // the 2 km base and 9.5 km upper deck. Oblique viewing reveals their parallax.
  vec2 viewUV = projectedDirection(viewRay,east,north,mapUV.y) * (.00118 / max(.14,noV));
  vec2 sunUV = projectedDirection(sun,east,north,mapUV.y) * (.00118 / max(.065,mu));
  vec2 texel = 1./vec2(textureSize(densityMap,0));
  vec2 toSun = normalize(sunUV / texel + vec2(.0001)) * texel;
  float daylight = smoothstep(-.34,.16,mu);
  vec3 skylight = mix(vec3(.18,.215,.38),vec3(.58,.69,.82),daylight);
  // The cloud tops closest to the sunrise catch a soft coral bounce from the horizon.
  float acrossSun = dot(n,normalize(cross(viewRay,sun)));
  float afterglow = exp2(-340.*acrossSun*acrossSun)*smoothstep(-.32,.015,mu);
  skylight += vec3(.38,.084,.072)*afterglow;
  vec3 direct = 1.65 * exp(-vec3(.034,.077,.14)/max(.045,mu+.047));
  float sunVisibility = smoothstep(-.075,.085,mu);
  float viewPath = 1./sqrt(.27+.73*noV*noV);
  vec3 scattered = vec3(0.);
  float transmission = 1.;
  for (int layer=0; layer<CLOUD_STEPS; layer++) {
    float depth = (float(layer)+.5)/float(CLOUD_STEPS);
    vec2 uv = mapUV-viewUV*depth;
    float density = texture2D(densityMap,uv).r;
    float upwind = texture2D(densityMap,uv+toSun*2.).r;
    // Thick systems rise higher, while a low-density cirrus component extends
    // through the column. Height is inferred from the 2D satellite composite.
    float filled = smoothstep(.12,.82,density+depth*.51);
    float extinction = 2.35*pow(density,1.20)*(.35+.85*filled);
    float absorbed = 1.-exp(-extinction*viewPath/float(CLOUD_STEPS));
    float blocker = texture2D(densityMap,uv+sunUV*(.2+depth*.6)).r;
    float shadow = exp(-2.4*depth*blocker);
    float crest = clamp((density-upwind)*4.5,-.48,.85);
    vec3 localLight = skylight * (.71+.49*density+.87*crest-.26*depth);
    localLight += direct*sunVisibility*shadow*max(.05,.37+mu+.96*crest);
    scattered += transmission*absorbed*localLight;
    transmission *= 1.-absorbed;
  }
  float opacity = 1.-transmission;
  gl_FragColor = vec4(scattered/max(opacity,.00001),opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const dawnSurfaceVertex = /* glsl */ `
uniform mat3 restRotation;
varying vec3 restNormal;
varying vec3 radial;
varying vec2 geography;
void main() {
  restNormal = restRotation * normal;
  radial = normalize(mat3(modelMatrix) * normal);
  geography = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;

// Project the painted hemisphere in the initial camera pose. Its texture moves
// with the globe; the broad illumination field remains locked to the sunrise.
export const dawnSurfaceFragment = /* glsl */ `
uniform vec4 globe;
uniform vec3 polarAxis;
uniform vec3 primeMeridian;
uniform vec3 east;
uniform sampler2D dawnMap;
uniform sampler2D lightsMap;
varying vec3 restNormal;
varying vec3 radial;
varying vec2 geography;

float limbAt(float x) {
  float dx = (x - globe.x) / globe.z;
  return globe.y + globe.z * globe.w * sqrt(max(0., 1. - dx*dx));
}

// Extend the finite artwork along the curvature of the horizon. Folding the
// distance below the limb keeps sky and sun out of distant terrain samples.
float limbDepth(vec3 n) {
  return max(0., limbAt(globe.x + globe.z*n.x) - (globe.y + globe.z*globe.w*n.y));
}
vec2 sourceUV(vec3 n, float viewDepth) {
  float x = globe.x + globe.z*n.x;
  float foldedX = 1. - abs(mod(x,2.) - 1.);
  // A grazing-angle photograph has no resolved detail perpendicular to its
  // limb. Bound that component of re-projection so it cannot stretch one
  // bright horizon texel across a newly visible swath of the hemisphere.
  float depth = clamp(limbDepth(n), .86*viewDepth, 1.14*viewDepth);
  float height = max(.01,limbAt(foldedX));
  float v = height - depth;
  if (v < 0.) v = .72*height * (1. - abs(mod(-v/(.72*height),2.)-1.));
  return vec2(foldedX, v);
}
vec3 detailAt(vec3 n, float viewDepth, vec3 illumination, float lod) {
  vec2 uv = sourceUV(n, viewDepth);
  vec3 painted = textureLod(dawnMap,uv,lod).rgb;
  vec3 localLight = textureLod(dawnMap,uv,5.5).rgb;
  return max(vec3(0.), (painted + .008)*(illumination + .008)/(localLight + .008) - .008);
}

void main() {
  vec3 here = normalize(radial);
  vec3 rest = normalize(restNormal);
  float viewDepth = limbDepth(here);
  vec2 fixedUV = sourceUV(here, viewDepth);
  vec2 texel = fixedUV*vec2(textureSize(dawnMap,0));
  vec2 dx = dFdx(texel), dy = dFdy(texel);
  float lod = .5*log2(max(1.,max(dot(dx,dx),dot(dy,dy))));
  vec3 illumination = textureLod(dawnMap,fixedUV,5.5).rgb;

  // Five overlapping longitudinal sectors extend the painted surface around
  // the full sphere. Neighbouring sectors share latitude and rotate together.
  const float sector = 6.28318530718 / 5.;
  const float firstLongitude = -1.04;
  float latitude = dot(rest,polarAxis);
  float circle = sqrt(max(0.,1.-latitude*latitude));
  float longitude = atan(dot(rest,east),dot(rest,primeMeridian));
  float phase = mod(longitude-firstLongitude,sector);
  float a = firstLongitude + phase;
  vec3 parallel = polarAxis*latitude;
  vec3 sampled = parallel + circle*(cos(a)*primeMeridian + sin(a)*east);
  vec3 terrain = detailAt(sampled, viewDepth, illumination, lod);
  if (phase > sector - .11) {
    float b = a - sector;
    vec3 neighbour = parallel + circle*(cos(b)*primeMeridian + sin(b)*east);
    terrain = mix(terrain,detailAt(neighbour, viewDepth, illumination, lod),smoothstep(sector-.11,sector,phase));
  }
  // Keep the very narrow optical fringe and the sun's reflection stationary.
  // The transition spans only the first few pixels inside the planet.
  float interior = smoothstep(.026,.077,here.z);
  vec3 color = mix(texture2D(dawnMap,fixedUV).rgb, terrain, interior);
  // In extrapolated longitudes, measured city emissions break up repetition.
  float extension = smoothstep(0.,.3,max(firstLongitude-longitude,longitude-firstLongitude-sector));
  color += extension * .10 * pow(texture2D(lightsMap,geography).r,1.7) * vec3(1.,.26,.07);
  gl_FragColor = vec4(color,1.);
  #include <colorspace_fragment>
}`;
