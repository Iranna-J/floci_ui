import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Zap, 
  Cpu, 
  Code2, 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Image as ImageIcon,
  Sparkles,
  Layers,
  Clock,
  HardDrive,
  RefreshCw,
  FileCode,
  Eye,
  EyeOff
} from 'lucide-react';

const LAMBDA_JAVA_HANDLER_CODE = `package com.example.flociapp.serverless;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * AWS Lambda Handler for Image Thumbnail Resizing (Pure Java 21)
 *
 * Utilizes the EXACT SAME ImageThumbnailFunction class from Step 1!
 */
public class ThumbnailLambdaHandler {

    private final ImageThumbnailFunction thumbnailFunction = new ImageThumbnailFunction();

    public Map<String, Object> handleRequest(Map<String, Object> input) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> response = new HashMap<>();

        try {
            String s3Key = (String) input.get("s3Key");
            int targetWidth = input.containsKey("targetWidth") ? ((Number) input.get("targetWidth")).intValue() : 150;
            int targetHeight = input.containsKey("targetHeight") ? ((Number) input.get("targetHeight")).intValue() : 150;
            String base64Image = (String) input.get("imageBase64");

            byte[] originalBytes = Base64.getDecoder().decode(base64Image);

            // Execute the EXACT same Java logic written in Step 1!
            ImageThumbnailFunction.ExecutionResult result = thumbnailFunction.apply(originalBytes, targetWidth, targetHeight);

            long elapsed = System.currentTimeMillis() - startTime;
            String thumbnailBase64 = Base64.getEncoder().encodeToString(result.thumbnailBytes());

            response.put("originalS3Key", s3Key);
            response.put("originalDimensions", result.originalDimensions());
            response.put("thumbnailDimensions", result.thumbnailDimensions());
            response.put("originalSizeBytes", (long) originalBytes.length);
            response.put("thumbnailSizeBytes", (long) result.thumbnailBytes().length);
            response.put("thumbnailBase64", thumbnailBase64);
            response.put("executionMode", "AWS_LAMBDA_JAVA_21");
            response.put("executionTimeMs", elapsed);
            response.put("message", "Thumbnail generated successfully via Java 21 AWS Lambda Container (reusing ImageThumbnailFunction.java)");
            response.put("success", true);
            return response;

        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            response.put("success", false);
            response.put("message", "Java Lambda Exception: " + e.getMessage());
            response.put("executionMode", "AWS_LAMBDA_JAVA_21");
            response.put("executionTimeMs", elapsed);
            return response;
        }
    }
}`;

const JAVA_IN_APP_CODE = `package com.example.flociapp.serverless;

import org.springframework.stereotype.Component;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

/**
 * In-App Image Resizing Logic (Phase 1)
 * Executed in-process inside Spring Boot JVM
 */
@Component
public class ImageThumbnailFunction {

    public ExecutionResult apply(byte[] originalBytes, int maxWidth, int maxHeight) {
        BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(originalBytes));
        
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Calculate proportional dimensions (preserve aspect ratio)
        double ratio = (double) originalWidth / originalHeight;
        int targetWidth = maxWidth;
        int targetHeight = maxHeight;

        if (ratio > 1.0) {
            targetHeight = (int) Math.round(maxWidth / ratio);
        } else {
            targetWidth = (int) Math.round(maxHeight * ratio);
        }

        // Render scaled thumbnail using Java Graphics2D
        BufferedImage thumb = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = thumb.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(thumb, "png", baos);
        return new ExecutionResult(baos.toByteArray(), originalWidth + "x" + originalHeight, targetWidth + "x" + targetHeight, true, null);
    }
}`;

export default function ServerlessLabSection({ user }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetWidth, setTargetWidth] = useState(150);
  const [targetHeight, setTargetHeight] = useState(150);
  const [executingMode, setExecutingMode] = useState(null); // 'in-app' | 'lambda' | null
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('lambda'); // 'lambda' | 'java'

  // Fetch image files from S3 to populate the input selector
  const loadImages = async () => {
    try {
      const allFiles = await api.getFiles();
      const imagesOnly = allFiles.filter(f => f.contentType && f.contentType.startsWith('image/'));
      setFiles(imagesOnly);
      if (imagesOnly.length > 0 && !selectedFile) {
        setSelectedFile(imagesOnly[0]);
      }
    } catch (err) {
      console.error('Failed to load image files for serverless lab:', err);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleRunInApp = async () => {
    if (!selectedFile) {
      setError('Please select an image file from S3 first (upload one above if list is empty).');
      return;
    }

    try {
      setExecutingMode('in-app');
      setError('');
      setSuccess('');
      setResult(null);

      const payload = {
        s3Key: selectedFile.s3Key,
        fileName: selectedFile.fileName,
        targetWidth: parseInt(targetWidth, 10),
        targetHeight: parseInt(targetHeight, 10)
      };

      const response = await api.runServerlessInApp(payload);
      setResult(response);
      if (response.success) {
        setSuccess(`In-App Function executed successfully in ${response.executionTimeMs}ms!`);
      } else {
        setError(response.message || 'Execution completed with error');
      }
    } catch (err) {
      setError(err.message || 'Execution failed');
    } finally {
      setExecutingMode(null);
    }
  };

  const handleRunViaLambda = async () => {
    if (!selectedFile) {
      setError('Please select an image file from S3 first (upload one above if list is empty).');
      return;
    }

    try {
      setExecutingMode('lambda');
      setError('');
      setSuccess('');
      setResult(null);

      const payload = {
        s3Key: selectedFile.s3Key,
        fileName: selectedFile.fileName,
        targetWidth: parseInt(targetWidth, 10),
        targetHeight: parseInt(targetHeight, 10)
      };

      const response = await api.runServerlessViaLambda(payload);
      setResult(response);
      if (response.success) {
        setSuccess(`AWS Lambda executed container successfully in ${response.executionTimeMs}ms!`);
      } else {
        setError(response.message || 'Lambda execution completed with error');
      }
    } catch (err) {
      setError(err.message || 'Lambda execution failed');
    } finally {
      setExecutingMode(null);
    }
  };

  return (
    <div className="card" style={{ marginTop: '2rem', border: '1px solid #4f46e5' }}>
      {/* Header */}
      <div className="card-header" style={{ borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#312e81', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
              <Zap size={22} color="#f59e0b" />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Step 4: AWS Lambda Serverless Lab</span>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem' }}>
            Experiment with function logic: test the function <strong>inside the app first</strong>, then we will deploy it as an <strong>AWS Lambda function in Floci</strong>!
          </p>
        </div>

        {/* Phase Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.3rem 0.6rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '6px',
            color: '#34d399',
            fontWeight: 600
          }}>
            Phase 1: In-App Logic (Ready)
          </span>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.3rem 0.6rem',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            color: '#fbbf24',
            fontWeight: 600
          }}>
            Phase 2: AWS Lambda in Floci (Active)
          </span>
        </div>
      </div>

      {/* Concept Explainer Banner & Code Viewer Toggle */}
      <div style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1.5rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 600 }}>
            <Code2 size={16} />
            <span>How AWS Lambda Works Behind the Scenes:</span>
          </div>

          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            style={{
              background: showCode ? '#312e81' : '#1e293b',
              border: '1px solid #4f46e5',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              color: '#a5b4fc',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileCode size={14} />
            <span>{showCode ? 'Hide Source Code' : '👁️ View Lambda Function Logic'}</span>
          </button>
        </div>

        <p style={{ color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
          Floci executes <code>floci-thumbnail-function</code> inside a real <strong>Java 21 AWS Lambda Container</strong>, reusing the exact same <code>ImageThumbnailFunction.java</code> written in Step 1! Click the button above to inspect both Java source files.
        </p>

        {/* Expandable Source Code Viewer */}
        {showCode && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveCodeTab('lambda')}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeCodeTab === 'lambda' ? '#f59e0b' : '#1e293b',
                  color: activeCodeTab === 'lambda' ? '#000' : '#94a3b8'
                }}
              >
                ☕ ThumbnailLambdaHandler.java (Java 21 Lambda Container)
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('java')}
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeCodeTab === 'java' ? '#818cf8' : '#1e293b',
                  color: activeCodeTab === 'java' ? '#fff' : '#94a3b8'
                }}
              >
                ☕ ImageThumbnailFunction.java (Step 1 In-App Logic)
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.75rem',
                fontSize: '0.7rem',
                color: '#64748b'
              }}>
                {activeCodeTab === 'lambda' ? 'Deployed to: Floci (Runtime: Java 21, Memory: 512MB)' : 'Reused by: In-App Service & Lambda Handler'}
              </div>
              <pre style={{
                background: '#030712',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.75rem',
                lineHeight: '1.5',
                color: activeCodeTab === 'lambda' ? '#38bdf8' : '#a5b4fc',
                maxHeight: '360px',
                overflowY: 'auto',
                margin: 0
              }}>
                {activeCodeTab === 'lambda' ? LAMBDA_JAVA_HANDLER_CODE : JAVA_IN_APP_CODE}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="error-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '0.6rem 0.85rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Playground Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Source Image Selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
              1. Select S3 Image to Process:
            </label>
            <button
              onClick={loadImages}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.1rem 0.3rem'
              }}
              title="Refresh images from S3"
            >
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>
          {files.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px dashed #334155' }}>
              No images found in S3 bucket. Upload a PNG/JPG in the File Upload section above first!
            </div>
          ) : (
            <select
              style={{
                width: '100%',
                padding: '0.65rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem'
              }}
              value={selectedFile?.id || ''}
              onChange={(e) => {
                const found = files.find(f => f.id === parseInt(e.target.value, 10));
                setSelectedFile(found);
              }}
            >
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.fileName} ({Math.round(file.size / 1024)} KB)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Target Dimensions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Target Max Width (px):
            </label>
            <input
              type="number"
              min="50"
              max="600"
              value={targetWidth}
              onChange={(e) => setTargetWidth(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
              Target Max Height (px):
            </label>
            <input
              type="number"
              min="50"
              max="600"
              value={targetHeight}
              onChange={(e) => setTargetHeight(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleRunInApp}
          disabled={executingMode !== null || !selectedFile}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
        >
          {executingMode === 'in-app' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Executing In-App Function...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="white" />
              <span>▶️ Run In-App Function (Spring Boot)</span>
            </>
          )}
        </button>

        <button
          className="btn"
          onClick={handleRunViaLambda}
          disabled={executingMode !== null || !selectedFile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
            cursor: (executingMode !== null || !selectedFile) ? 'not-allowed' : 'pointer',
            opacity: (executingMode !== null || !selectedFile) ? 0.6 : 1
          }}
          title="Invoke real Java 21 AWS Lambda container in Floci (reusing ImageThumbnailFunction.java)"
        >
          {executingMode === 'lambda' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Invoking Java 21 AWS Lambda Container...</span>
            </>
          ) : (
            <>
              <Cpu size={16} color="#000" />
              <span>⚡ Run via Java 21 AWS Lambda (Floci)</span>
            </>
          )}
        </button>
      </div>

      {/* Live Serverless Inspector Console */}
      {result && (
        <div style={{
          background: '#0a0e17',
          border: result.executionMode === 'AWS_LAMBDA' ? '1px solid #f59e0b' : '1px solid #334155',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: result.executionMode === 'AWS_LAMBDA' ? '0 0 16px rgba(245, 158, 11, 0.15)' : 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#f59e0b" />
              <span>Serverless Execution Console</span>
            </h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                background: result.executionMode === 'AWS_LAMBDA' ? 'rgba(245, 158, 11, 0.2)' : '#312e81',
                color: result.executionMode === 'AWS_LAMBDA' ? '#fbbf24' : '#a5b4fc',
                border: result.executionMode === 'AWS_LAMBDA' ? '1px solid #f59e0b' : 'none',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                Mode: {result.executionMode}
              </span>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '4px', fontWeight: 600 }}>
                Time: {result.executionTimeMs} ms
              </span>
            </div>
          </div>

          {/* Visual Comparison: Input vs Output */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Input S3 Image */}
            <div style={{ background: '#1e293b', borderRadius: '8px', padding: '0.75rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.5rem' }}>
                INPUT (Original from S3):
              </div>
              <div style={{ height: '140px', background: '#0f172a', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={api.getFileViewUrl(selectedFile.id)}
                  alt="Original"
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
                <div>Resolution: <strong>{result.originalDimensions}</strong></div>
                <div>Size: <strong>{Math.round(result.originalSizeBytes / 1024)} KB</strong></div>
              </div>
            </div>

            {/* Output Thumbnail in S3 */}
            <div style={{ background: '#1e293b', borderRadius: '8px', padding: '0.75rem', border: '1px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>OUTPUT ({result.executionMode === 'AWS_LAMBDA' ? '⚡ AWS Lambda Processed' : 'In-App Processed'}):</span>
                <span>{result.thumbnailDimensions}</span>
              </div>
              <div style={{ height: '140px', background: '#0f172a', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {result.thumbnailS3Key ? (
                  <img
                    src={api.getServerlessThumbnailUrl(result.thumbnailS3Key)}
                    alt="Thumbnail"
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>No thumbnail produced</div>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '0.5rem' }}>
                <div>Resolution: <strong>{result.thumbnailDimensions}</strong></div>
                <div>Size: <strong>{result.thumbnailSizeBytes} Bytes</strong></div>
              </div>
            </div>
          </div>

          {/* JSON Payload Inspector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem' }}>
                Input Event Payload:
              </div>
              <pre style={{
                background: '#000',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#38bdf8',
                overflowX: 'auto',
                margin: 0
              }}>
{JSON.stringify({
  s3Key: result.originalS3Key,
  targetWidth: targetWidth,
  targetHeight: targetHeight
}, null, 2)}
              </pre>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.35rem' }}>
                Output Response Payload:
              </div>
              <pre style={{
                background: '#000',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#34d399',
                overflowX: 'auto',
                margin: 0
              }}>
{JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
