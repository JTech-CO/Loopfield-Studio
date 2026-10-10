# Implementation references

**English** · [한국어](SOURCES-KR.md)

The original implementation checked these official references on 2026-09-22. No external library source was bundled.

1. [W3C WebCodecs](https://www.w3.org/TR/webcodecs/): VideoEncoder, VideoFrame, timestamps, flush, close and support queries.
2. [Chrome: Video processing with WebCodecs](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs): canvas frames, configuration queries, resource release and secure contexts.
3. [W3C AVC registration](https://www.w3.org/TR/webcodecs-avc-codec-registration/): AVC chunks and decoder configuration; implementations are not required to support H.264.
4. [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages): artifacts, deployment environments and permissions.
5. [Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages): domain configuration.
6. [Chromium H.264 level limits](https://chromium.googlesource.com/chromium/src/+/refs/tags/143.0.7499.183/media/parsers/h264_level_limits.h): macroblock counts, throughput and bitrate limits.

See [maintenance tests](../tests/README.md) for reproducible rendering, UI and media checks. Generated reports stay in the ignored `test-artifacts/` directory. Codec availability is checked dynamically because documentation cannot establish support on a particular browser and OS.
