    attribute vec4 a_Position;
    attribute vec4 a_Color;
    attribute vec4 a_Normal;        // Normal
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_NormalMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjMatrix;
    uniform vec3 u_LightColor;     // Light color
    uniform vec3 u_LightDirection; // Light direction (in the world coordinate, normalized)
    varying vec4 v_Color;
    uniform bool u_isLighting;
    uniform vec3 u_PointLightPosition; //Position of the light source
    uniform vec3 u_PointLightColour;
    void main() {
      gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
      if(u_isLighting)
      {
         vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
         float nDotL = max(dot(normal, u_LightDirection), 0.0);
    // Calculate the color due to diffuse reflection
         vec3 directionalDiffuse = u_LightColor * a_Color.rgb * nDotL; //Calculates the diffuse for the directional light

         vec4 vertexPosition = u_ModelMatrix * a_Position; //The vertex's position};
         vec3 pointlightdirection = (normalize(u_PointLightPosition - vec3(vertexPosition)));
         nDotL = max(dot(pointlightdirection, normal), 0.0);
         vec3 pointDiffuse = u_PointLightColour.rgb * a_Color.rgb * nDotL;

         v_Color = vec4(directionalDiffuse + pointDiffuse, a_Color.a);}
      else
      {
         v_Color = a_Color;
      }
    }