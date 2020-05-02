#ifdef GL_ES
precision mediump float;
#endif
uniform bool u_isDirectionalLighting;
uniform bool u_isPointLighting;
uniform vec3 u_PointLightColor;
uniform vec3 u_PointLightPosition;
uniform vec3 u_LightColor;// Light color
uniform vec3 u_LightDirection;// Light direction (in the world coordinate, normalized)
varying vec4 v_Color;
varying vec3 v_Position;
varying vec3 v_Normal;
void main() {
    vec3 normal = normalize(v_Normal);

    float nDotL = max(dot(normal, u_LightDirection), 0.0);
    // Calculate the color due to diffuse reflection
    vec3 directionalDiffuse = u_LightColor * v_Color.rgb * nDotL;//Calculates the diffuse for the directional light

    vec3 pointLightDirection = (normalize(u_PointLightPosition - v_Position));
    nDotL = max(dot(pointLightDirection, normal), 0.0);
    vec3 pointDiffuse = u_PointLightColor.rgb * v_Color.rgb * nDotL;
    if (!u_isDirectionalLighting){ directionalDiffuse = vec3(0, 0, 0); }
    if (!u_isPointLighting){pointDiffuse = vec3(0, 1, 0); }
    gl_FragColor = vec4(directionalDiffuse + pointDiffuse, v_Color.a);
}