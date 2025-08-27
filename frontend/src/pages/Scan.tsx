import MainLayout from '../components/MainLayout';
import Dropzone from '../components/upload/Dropzone';
import { getUploadConfig } from '../config/upload';
import { useState } from 'react';

export default function Scan() {
      const cfg = getUploadConfig();
      const [file, setFile] = useState<File | null>(null);
    
      return (
            <MainLayout>
                  <div className="mx-auto max-w-3xl py-10">
                        <h1 className="text-2xl font-semibold">Scan & Upload</h1>
                        <p className="mt-1 opacity-80">Upload your document to start processing.</p>
                
                        <div className="mt-6">
                              <Dropzone
                                    acceptExtensions={cfg.acceptedExtensions}
                                    maxFileSizeMB={cfg.maxFileSizeMB}
                                    multiple={cfg.multiple}
                                    onFileSelected={(f) => setFile(f)}
                              />
                        </div>
                
                        {file && (
                              <div className="mt-6 rounded-xl bg-gray-700 p-4">
                                    <h2 className="mb-2 text-lg font-medium">Ready to send</h2>
                                    <ul className="list-inside list-disc text-sm opacity-90">
                                          <li>File: <span className="font-mono">{file.name}</span></li>
                                          <li>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</li>
                                          <li>Type: {file.type || 'unknown'}</li>
                                    </ul>
                              </div>
                        )}
                  </div>
            </MainLayout>
      );
}
