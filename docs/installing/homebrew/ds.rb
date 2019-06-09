require "language/node"

# Keep the version and version in the test up to date!
# Get the sha256 with shasum -a 256 ds-latest.tgz

class Ds < Formula
  desc "ds: entropy delta; the entropic client"
  homepage "https://github.com/entropic-dev/entropic/tree/master/cli"
  url "https://www.entropic.dev/ds-latest.tgz"
  sha256 "4d98654bddd2d4e31450a0cd9d45514d3257ff218f243feca7919e2b0e8ed3b8"
  depends_on "node"
  version "1.0.0"

  def install
    system "npm", "install" , *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "v1.0.0", shell_output("#{bin}/ds --version")
  end
end
