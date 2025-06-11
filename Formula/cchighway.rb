class Cchighway < Formula
  desc "Claude Code Highway - A wrapper tool for Claude Code with web server interface"
  homepage "https://github.com/sanbasan/homebrew-cchighway"
  url "https://github.com/sanbasan/homebrew-cchighway/releases/download/1.0.1/cchighway-1.0.1"
  sha256 "00ab9bd27bf3cd98942eb5784054349c7bb8e44ac9b60bbe93b222ae5e5684a2"
  license "Private"

  depends_on "node"

  def install
    bin.install "cchighway-1.0.1" => "cchighway"
  end

  test do
    assert_match "1.0.1", shell_output("#{bin}/cchighway --version")
  end
end
