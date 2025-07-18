
'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Copy } from 'lucide-react';
import { getLatestCID } from '@/lib/resolve-ipns';
import { extractJsonFromPdf } from '@/lib/read-json';
import { processSigningData } from '@/lib/process-signing-data';

interface DelegationData {
    recipientDid: string;
    signerName: string; // Add signer name
    delegation: string;
    fileName: string;
}

interface SignedData {
    signer: string;
    signedAt: string;
    documentId: string;
    fileName: string;
    signatureHash: string;
}

interface ProcessedSigner {
    id: number;
    did: string;
    signerName: string; // Add signer name
    fileName: string;
    status: 'signed' | 'pending';
    timestamp: string | null;
    signatureHash?: string;
}

interface ProcessedSigningData {
    ipnsName: string;
    signers: ProcessedSigner[];
    totalSigners: number;
    currentSignatures: number;
    fileName: string;
}

export function processSigningData(
    delegations: DelegationData[],
    signatures: SignedData[],
    ipnsName: string
): ProcessedSigningData {
    // Create a map of signed DIDs for quick lookup
    const signedDidsMap = new Map<string, SignedData>();
    signatures.forEach(sig => {
        signedDidsMap.set(sig.signer, sig);
    });

    // Process delegations and match with signatures
    const processedSigners: ProcessedSigner[] = delegations.map((delegation, index) => {
        const signedData = signedDidsMap.get(delegation.recipientDid);
        
        return {
            id: index + 1,
            did: delegation.recipientDid,
            signerName: delegation.signerName || `Signer ${index + 1}`, // Use signer name from delegation
            fileName: delegation.fileName,
            status: signedData ? 'signed' : 'pending',
            timestamp: signedData ? signedData.signedAt : null,
            signatureHash: signedData?.signatureHash
        };
    });

    // Calculate actual signatures that match delegations (prevent overflow)
    const validSignatures = signatures.filter(sig => 
        delegations.some(del => del.recipientDid === sig.signer)
    );

    return {
        ipnsName,
        signers: processedSigners,
        totalSigners: delegations.length,
        currentSignatures: validSignatures.length,
        fileName: delegations[0]?.fileName || 'Unknown'
    };
}

const IPNSProgressTracker = () => {
    const [ipnsName, setIpnsName] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [progressData, setProgressData] = useState(null);
    const [error, setError] = useState('');

    const handleCheck = async () => {
        if (!ipnsName.trim()) return;

        setIsChecking(true);
        setError('');
        setProgressData(null);

        try {
            console.log("Resolving IPNS name:", ipnsName);
            const latestCid = await getLatestCID(ipnsName);
            console.log("Latest CID:", latestCid);

            // Fetch delegation and signed data
            const delegationsUrl = `https://w3s.link/ipfs/${latestCid}/delegations.pdf`;
            const signedUrl = `https://w3s.link/ipfs/${latestCid}/signed.pdf`;

            console.log("Fetching delegations from:", delegationsUrl);
            const delegationsData = await extractJsonFromPdf(delegationsUrl);
            
            console.log("Fetching signatures from:", signedUrl);
            const signedData = await extractJsonFromPdf(signedUrl);

            // Process the data
            const processedData = processSigningData(delegationsData, signedData, ipnsName);
            console.log("Processed data:", processedData);

            setProgressData(processedData);
        } catch (err) {
            console.error("Error fetching signing data:", err);
            setError(err.message || 'Failed to fetch signing data');
        } finally {
            setIsChecking(false);
        }
    };

    const getProgressPercentage = () => {
        if (!progressData || progressData.totalSigners === 0) return 0;
        // Ensure percentage never exceeds 100%
        const percentage = (progressData.currentSignatures / progressData.totalSigners) * 100;
        return Math.min(percentage, 100);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'signed':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'pending':
                return <Clock className="w-6 h-6 text-gray-400" />;
            default:
                return <Clock className="w-6 h-6 text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'signed':
                return 'bg-green-500';
            case 'pending':
                return 'bg-gray-300';
            default:
                return 'bg-gray-300';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const formatDid = (did) => {
        // Show first 20 and last 10 characters for better readability
        if (did.length > 30) {
            return `${did.substring(0, 20)}...${did.substring(did.length - 10)}`;
        }
        return did;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Signing Tracker</h1>
                    <p className="text-gray-600">Track document signing progress for IPNS delegations</p>
                </div>

                {/* Input Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="mb-4">
                        <label htmlFor="ipns-input" className="block text-sm font-medium text-gray-700 mb-2">
                            Enter IPNS Name
                        </label>
                        <textarea
                            id="ipns-input"
                            value={ipnsName}
                            onChange={(e) => setIpnsName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows="3"
                            placeholder="k51qzi5uqu5djg8j2h8xk3z9j4h5m6n7o8p9q0r1s2t3u4v5w6x7y8z9..."
                        />
                    </div>

                    <button
                        onClick={handleCheck}
                        disabled={!ipnsName.trim() || isChecking}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isChecking ? 'Checking Progress...' : 'Check Signing Progress'}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Progress Results */}
                {progressData && (
                    <div className="space-y-6">
                        {/* Progress Summary */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Signing Summary</h2>
                                <span className="text-sm text-gray-500">
                                    {progressData.currentSignatures} of {progressData.totalSigners} signers completed
                                </span>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                                    <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${getProgressPercentage()}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Document:</span>
                                    <div className="font-semibold text-gray-900">{progressData.fileName}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total Signers:</span>
                                    <div className="font-semibold text-gray-900">{progressData.totalSigners}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">IPNS Name:</span>
                                    <div className="font-mono text-gray-900 break-all text-xs">{formatDid(progressData.ipnsName)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Linear Progress Bar */}
                        {progressData.signers.length <= 10 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Signing Progress</h3>

                                <div className="relative">
                                    {/* Progress Line */}
                                    <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded-full">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${getProgressPercentage()}%` }}
                                        ></div>
                                    </div>

                                    {/* Signer Nodes */}
                                    <div className="flex justify-between items-center relative z-10">
                                        {progressData.signers.map((signer) => (
                                            <div key={signer.id} className="flex flex-col items-center">
                                                {/* Node Circle */}
                                                <div className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${getStatusColor(signer.status)}`}>
                                                    {getStatusIcon(signer.status)}
                                                </div>

                                                {/* Node Info */}
                                                <div className="mt-3 text-center">
                                                    <div className="text-sm font-medium text-gray-900">{signer.signerName}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{formatDid(signer.did)}</div>
                                                    {signer.timestamp && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {new Date(signer.timestamp).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detailed Status */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Status</h3>

                            <div className="space-y-3">
                                {progressData.signers.map((signer) => (
                                    <div key={signer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            {getStatusIcon(signer.status)}
                                            <div>
                                                <div className="font-medium text-gray-900">{signer.signerName}</div>
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    <span className="font-mono">{formatDid(signer.did)}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(signer.did)}
                                                        className="ml-2 text-blue-500 hover:text-blue-700"
                                                        title="Copy full DID"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {signer.signatureHash && (
                                                    <div className="text-xs text-gray-400 font-mono">
                                                        Hash: {signer.signatureHash.substring(0, 16)}...
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`text-sm font-medium capitalize ${
                                                signer.status === 'signed' ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                                {signer.status}
                                            </div>
                                            {signer.timestamp && (
                                                <div className="text-xs text-gray-400">
                                                    {new Date(signer.timestamp).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isChecking && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-gray-600">Fetching signing data...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IPNSProgressTracker;