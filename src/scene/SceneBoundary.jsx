import { Component } from "react";

// Any failure in the 3D layer (WebGL context, chunk download, shader compile)
// drops the page to its static version instead of leaving a blank screen.
export default class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn("3D scene disabled:", error);
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
