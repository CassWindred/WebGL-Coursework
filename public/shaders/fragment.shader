#ifdef GL_ES
precision mediump float;
#endif
uniform float u_isDirectionalLighting;
uniform bool u_UseTextures;
uniform float u_isPointLighting;
uniform bool u_isLighting;
uniform float u_isAmbientLighting;

uniform sampler2D u_Sampler;

uniform vec3 u_AmbientLightColor;

uniform vec3 u_PointLightColor;
uniform vec3 u_PointLightPosition;
uniform float u_PointLightBrightness;

uniform vec3 u_DirectionalLightColor;// Light color
uniform vec3 u_LightDirection;// Light direction (in the world coordinate, normalized)
uniform float u_DirectionalLightBrightness;

varying vec4 v_Color;
varying vec3 v_Position;
varying vec3 v_Normal;
varying vec2 v_TexCoords;

void main() {
    vec4 useColor;
    float testmod;
    vec4 texture = texture2D(u_Sampler, v_TexCoords);
    if (u_UseTextures) {
        useColor = texture;
        //testmod = 1000.0;
    } else {
        useColor = v_Color;
        //testmod=1.0;
    }
    if (u_isLighting && !((u_isDirectionalLighting==0.0)&&(u_isPointLighting==0.0))) {
    vec3 normal = normalize(v_Normal); //Get the normal

        //Do the calculations for the directional light
    float nDotL = max(dot(normal, u_LightDirection), 0.0);
    vec3 directionalDiffuse = u_DirectionalLightColor * useColor.rgb * nDotL * u_isDirectionalLighting * u_DirectionalLightBrightness;//Calculates the diffuse for the directional light

        //Do the calculations for the point light
    vec3 pointLightDirection = (normalize(u_PointLightPosition - v_Position));
    nDotL = max(dot(pointLightDirection, normal), 0.0);
    vec3 pointDiffuse = u_PointLightColor.rgb * useColor.rgb * nDotL * u_PointLightBrightness *u_isPointLighting;
    vec3 ambientDiffuse = u_AmbientLightColor.rgb * useColor.rgb * u_isAmbientLighting;

    gl_FragColor = vec4(directionalDiffuse + pointDiffuse + ambientDiffuse, v_Color.a);
    //gl_FragColor = vec4(u_PointLightPosition, 1.0);
} else {gl_FragColor = useColor;}}