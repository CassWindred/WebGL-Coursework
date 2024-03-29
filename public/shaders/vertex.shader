#ifdef GL_ES
precision mediump float;
#endif
attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec4 a_Normal;// Normal
attribute vec2 a_TexCoords;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform vec3 u_LightDirection;// Light direction (in the world coordinate, normalized)
varying vec4 v_Color;
varying vec3 v_Normal;
varying vec3 v_Position;
varying vec2 v_TexCoords;
uniform bool u_isLighting;

void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;

    v_Position = vec3(u_ModelMatrix * a_Position);
    v_Normal = normalize((u_NormalMatrix * a_Normal).xyz);

    v_TexCoords = a_TexCoords;
    v_Color = a_Color;
}