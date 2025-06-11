class Cchighway < Formula
  desc "Claude Code Highway - A wrapper tool for Claude Code with web server interface"
  homepage "https://github.com/sanbasan/homebrew-cchighway"
  url "https://github.com/sanbasan/homebrew-cchighway/releases/download/v1.0.0/cchighway-1.0.0"
  sha256 "9ba519c06b8407197ecfc70e64083734302d88cf32d70bf12e2950633f9dcbd0"
  license "Private"

  depends_on "node"

  def install
    bin.install "cchighway-1.0.0" => "cchighway"
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/cchighway --version")
  end
end
