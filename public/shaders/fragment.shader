#ifdef GL_ES
precision mediump float;
#endif
uniform bool u_isDirectionalLighting;
uniform bool u_UseTextures;
uniform bool u_isPointLighting;
uniform bool u_isLighting;

uniform sampler2D u_Sampler;

uniform vec3 u_PointLightColor;
uniform vec3 u_PointLightPosition;
uniform float u_PointLightBrightness;

uniform vec3 u_LightColor;// Light color
uniform vec3 u_LightDirection;// Light direction (in the world coordinate, normalized)

varying vec4 v_Color;
varying vec3 v_Position;
varying vec3 v_Normal;
varying vec2 v_TexCoords;

void main() {
    vec4 useColor;
    float testmod;
    if (u_UseTextures) {
        useColor = texture2D(u_Sampler, v_TexCoords);
        //testmod = 1000.0;
    } else {
        useColor = v_Color;
        //testmod=1.0;
    }
    if (u_isLighting) {
    vec3 normal = normalize(v_Normal); //Get the normal

        //Do the calculations for the directional light
    float nDotL = max(dot(normal, u_LightDirection), 0.0);
    vec3 directionalDiffuse = u_LightColor * useColor.rgb * nDotL;//Calculates the diffuse for the directional light

        //Do the calculations for the point light
    vec3 pointLightDirection = (normalize(u_PointLightPosition - v_Position));
    nDotL = max(dot(pointLightDirection, normal), 0.0);
    vec3 pointDiffuse = u_PointLightColor.rgb * useColor.rgb * nDotL * u_PointLightBrightness;

        //Check flags, replacing diffuse values with zero-vectors if they are not enables
    if (!u_isDirectionalLighting){ directionalDiffuse = vec3(0,0,0); }
    if (!u_isPointLighting){pointDiffuse = vec3(0,0,0); }
    gl_FragColor = vec4(directionalDiffuse + pointDiffuse, v_Color.a);
    //gl_FragColor = vec4(u_PointLightPosition, 1.0);
} else {gl_FragColor = v_Color;}}