
'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Copy } from 'lucide-react';

const IPNSProgressTracker = () => {
    const [ipnsName, setIpnsName] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [progressData, setProgressData] = useState(null);

    // Mock data structure - replace with your actual data fetching logic
    const mockProgressData = {
        ipnsName: 'k51qzi5uqu5djg8j2h8xk3z9j4h5m6n7o8p9q0r1s2t3u4v5w6x7y8z9',
        signers: [
            { id: 1, name: 'Node A', address: '0x1234...5678', status: 'signed', timestamp: '2025-01-15T10:30:00Z' },
            { id: 2, name: 'Node B', address: '0x2345...6789', status: 'signed', timestamp: '2025-01-15T10:35:00Z' },
            { id: 3, name: 'Node C', address: '0x3456...7890', status: 'missed', timestamp: null },
            { id: 4, name: 'Node D', address: '0x4567...8901', status: 'pending', timestamp: null },
            { id: 5, name: 'Node E', address: '0x5678...9012', status: 'pending', timestamp: null },
        ],
        totalSigners: 5,
        requiredSignatures: 3,
        currentSignatures: 2
    };

    const handleCheck = async () => {
        if (!ipnsName.trim()) return;

        setIsChecking(true);

        // Simulate API call
        setTimeout(() => {
            setProgressData(mockProgressData);
            setIsChecking(false);
        }, 1500);
    };

    const getProgressPercentage = () => {
        if (!progressData) return 0;
        const signedCount = progressData.signers.filter(signer => signer.status === 'signed').length;
        return (signedCount / progressData.totalSigners) * 100;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'signed':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'missed':
                return <XCircle className="w-6 h-6 text-red-500" />;
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
            case 'missed':
                return 'bg-red-500';
            case 'pending':
                return 'bg-gray-300';
            default:
                return 'bg-gray-300';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">IPNS Progress Tracker</h1>
                    <p className="text-gray-600">Track signing progress for IPNS name resolution</p>
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
                        {isChecking ? 'Checking Progress...' : 'Check Progress'}
                    </button>
                </div>

                {/* Progress Results */}
                {progressData && (
                    <div className="space-y-6">
                        {/* Progress Summary */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Progress Summary</h2>
                                <span className="text-sm text-gray-500">
                                    {progressData.currentSignatures} of {progressData.requiredSignatures} required signatures
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

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">IPNS Name:</span>
                                    <div className="font-mono text-gray-900 break-all">{progressData.ipnsName}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total Signers:</span>
                                    <div className="font-semibold text-gray-900">{progressData.totalSigners}</div>
                                </div>
                            </div>
                        </div>

                        {/* Linear Progress Bar */}
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
                                    {progressData.signers.map((signer, index) => (
                                        <div key={signer.id} className="flex flex-col items-center">
                                            {/* Node Circle */}
                                            <div className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${getStatusColor(signer.status)}`}>
                                                {getStatusIcon(signer.status)}
                                            </div>

                                            {/* Node Info */}
                                            <div className="mt-3 text-center">
                                                <div className="text-sm font-medium text-gray-900">{signer.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{signer.address}</div>
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

                        {/* Detailed Status */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Status</h3>

                            <div className="space-y-3">
                                {progressData.signers.map((signer) => (
                                    <div key={signer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            {getStatusIcon(signer.status)}
                                            <div>
                                                <div className="font-medium text-gray-900">{signer.name}</div>
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    {signer.address}
                                                    <button
                                                        onClick={() => copyToClipboard(signer.address)}
                                                        className="ml-2 text-blue-500 hover:text-blue-700"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`text-sm font-medium capitalize ${signer.status === 'signed' ? 'text-green-600' :
                                                    signer.status === 'missed' ? 'text-red-600' : 'text-gray-500'
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
                            <span className="text-gray-600">Checking progress...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IPNSProgressTracker;