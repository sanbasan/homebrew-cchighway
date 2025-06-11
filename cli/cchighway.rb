class Cchighway < Formula
  desc "Claude Code Highway - A wrapper tool for Claude Code with web server interface"
  homepage "https://github.com/sanbasan/homebrew-cchighway"
  url "https://github.com/sanbasan/homebrew-cchighway/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "d5558cd419c8d46bdc958064cb97f963d1ea793866414c025906ec15033512ed"
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
