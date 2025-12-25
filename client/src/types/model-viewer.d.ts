import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          "ios-src"?: string;
          poster?: string;
          alt?: string;
          ar?: boolean | string;
          "ar-modes"?: string;
          "ar-scale"?: string;
          "ar-placement"?: string;
          "camera-controls"?: boolean | string;
          "touch-action"?: string;
          "auto-rotate"?: boolean | string;
          "auto-rotate-delay"?: number | string;
          "rotation-per-second"?: string;
          "interaction-prompt"?: string;
          "interaction-prompt-threshold"?: number | string;
          loading?: "auto" | "lazy" | "eager";
          reveal?: "auto" | "manual";
          "environment-image"?: string;
          "skybox-image"?: string;
          "shadow-intensity"?: number | string;
          "shadow-softness"?: number | string;
          exposure?: number | string;
          "tone-mapping"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          "min-field-of-view"?: string;
          "max-field-of-view"?: string;
          "camera-orbit"?: string;
          "camera-target"?: string;
          "field-of-view"?: string;
          bounds?: string;
          "interpolation-decay"?: number | string;
        },
        HTMLElement
      >;
    }
  }
}
