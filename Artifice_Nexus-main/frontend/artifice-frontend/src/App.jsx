import { useState, useRef } from "react";
import axios from "axios";
import { FaPaintBrush, FaDownload, FaCamera } from "react-icons/fa";
import { GiPencil, GiPaintBucket } from "react-icons/gi";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import Webcam from "react-webcam";

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalURL, setOriginalURL] = useState(null);
  const [outputImage, setOutputImage] = useState(null);
  const [style, setStyle] = useState("White-box Cartoonizer");
  const [loading, setLoading] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [showCam, setShowCam] = useState(false);
  const webcamRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setOriginalURL(URL.createObjectURL(file));
    }
  };

  const capturePhoto = () => {
  if (webcamRef.current) {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setOriginalURL(imageSrc);
      setShowCam(false);
      setSelectedFile(null); // clear any uploaded file
    } else {
      alert("Capture failed — try again after allowing camera access.");
    }
  }
};


  const generateArt = async () => {
    if (!originalURL) return alert("Upload or capture a photo first!");
    setLoading(true);

    const formData = new FormData();
    if (originalURL.startsWith("blob:")) {
      // File from upload
      const response = await fetch(originalURL);
      const blob = await response.blob();
      formData.append("image", blob);
    } else if (originalURL.startsWith("data:image")) {
      // Image from webcam
      const res = await fetch(originalURL);
      const blob = await res.blob();
      formData.append("image", blob);
    }

    formData.append("style", style);

    const res = await axios.post("https://artifice-nexus.onrender.com/stylize", formData, { responseType: "blob" });
    const outputURL = URL.createObjectURL(res.data);
    setOutputImage(outputURL);
    setGallery([{ original: originalURL, result: outputURL, style }, ...gallery]);
    setLoading(false);
  };

  const downloadImage = (type) => {
    if (!outputImage) return;
    if (type === "pdf") {
      const doc = new jsPDF();
      doc.text("AI Artwork - The Artifice Nexus", 10, 10);
      doc.addImage(outputImage, "PNG", 10, 20, 180, 160);
      doc.save("artwork.pdf");
    } else {
      saveAs(outputImage, `artwork.${type}`);
    }
  };

  return (
    <div className="relative min-h-screen text-gray-100 overflow-hidden">
      {/* 🌌 Moving Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 animate-bgMove"></div>

      <div className="relative z-10 flex flex-col items-center justify-start p-6">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 mt-6">
          🎨 PICASSO'S PUNCHLINE
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          AI-powered photo stylizer — transform your photos into art
        </p>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-3xl hover:border-pink-400 transition-all duration-300">

          {/* Top Buttons */}
          <div className="flex justify-center gap-6 mb-8">
            {[
              { name: "White-box Cartoonizer", icon: <FaPaintBrush />, label: "Cartoon" },
              { name: "Pencil Sketch", icon: <GiPencil />, label: "Sketch" },
              { name: "Oil Painting", icon: <GiPaintBucket />, label: "Oil" },
            ].map((btn) => (
              <button
                key={btn.name}
                onClick={() => setStyle(btn.name)}
                className={`group px-6 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 ${
                  style === btn.name
                    ? "bg-gradient-to-r from-yellow-400 to-pink-500 text-black shadow-lg scale-105"
                    : "bg-gray-800 hover:bg-gray-700 hover:scale-105"
                }`}
              >
                <span className="text-lg">{btn.icon}</span>
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* File Upload + Webcam */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
            <label className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg cursor-pointer transition-all text-center">
              📁 Upload Photo
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>

            <button
              onClick={() => setShowCam(!showCam)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:scale-105 transition-all"
            >
              <FaCamera /> {showCam ? "Close Camera" : "Use Webcam"}
            </button>
          </div>

          {/* Webcam Display */}
          {showCam && (
            <div className="flex flex-col items-center mb-4">
              <Webcam
                ref={webcamRef}
              audio={false}
              mirrored={true}
              screenshotFormat="image/jpeg"
              screenshotQuality={1}
              width={640}
              height={480}
              className="rounded-xl shadow-lg border-2 border-gray-700"
              />
              <button
                onClick={capturePhoto}
                className="mt-4 bg-yellow-400 text-black px-6 py-2 rounded-lg font-bold hover:scale-105"
              >
                📸 Capture Photo
              </button>
            </div>
          )}

          {/* Show Original Preview */}
          {originalURL && (
            <div className="mt-6">
              <h3 className="text-center text-gray-300 mb-2">Original Image</h3>
              <img
                src={originalURL}
                alt="Original"
                className="rounded-xl w-full shadow-lg border border-gray-700"
              />
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={generateArt}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-400 to-pink-500 text-black font-bold px-8 py-3 rounded-xl hover:scale-110 transition-all duration-300 shadow-lg"
            >
              {loading ? "✨ Generating..." : "Generate Art"}
            </button>
          </div>

          {/* Before After Comparison */}
          {originalURL && outputImage && (
            <div className="mt-10">
              <h3 className="text-lg mb-3 text-gray-300 text-center">📊 Before–After Comparison</h3>
              <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={originalURL} alt="Original" />}
                itemTwo={<ReactCompareSliderImage src={outputImage} alt="Result" />}
                className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              />
            </div>
          )}

          {/* Download Buttons */}
          {outputImage && (
            <div className="mt-6 flex justify-center gap-5">
              <button onClick={() => downloadImage("png")} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow-md">
                <FaDownload /> PNG
              </button>
              <button onClick={() => downloadImage("jpg")} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow-md">
                <FaDownload /> JPG
              </button>
              <button onClick={() => downloadImage("pdf")} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 shadow-md">
                <FaDownload /> PDF
              </button>
            </div>
          )}
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mt-10 w-full max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-4 text-pink-400">🖼️ Your Gallery</h2>
            <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
              {gallery.map((item, index) => (
                <div key={index} className="bg-white/10 rounded-xl overflow-hidden shadow-lg p-2 hover:scale-105 transition-all duration-300">
                  <img src={item.result} alt={`Artwork-${index}`} className="rounded-lg mb-2" />
                  <p className="text-center text-sm text-gray-300">{item.style}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-10 text-gray-500 text-sm">
          Made with ❤️ using React + Flask + TensorFlow
        </footer>
      </div>
    </div>
  );
}
