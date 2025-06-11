class Cchighway < Formula
  desc "Claude Code Highway - A wrapper tool for Claude Code with web server interface"
  homepage "https://github.com/Kishikawa1286/cchighway"
  url "https://github.com/Kishikawa1286/cchighway/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5"
  license "Private"

  depends_on "node"

  def install
    cd "cli" do
      system "npm", "install", "--production"
      system "npm", "run", "build"
      system "npm", "run", "build:single"
      
      bin.install "dist/bin/index.js" => "cchighway"
    end
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/cchighway --version")
  end
end
