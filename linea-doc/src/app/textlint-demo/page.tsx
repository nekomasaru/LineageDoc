"use client";

import React from 'react';
import { TextLintProvider } from '../../contexts/TextLintContext';
import { TextLintEditor } from '../../components/textlint/TextLintEditor';

export default function TextLintDemoPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        文化庁基準準拠・文書校正システム (Demo)
                    </h1>
                    <a href="/v2" className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        ← LineaDoc v2 に戻る
                    </a>
                </div>
                <p className="mt-2 text-gray-600">
                    公用文作成の考え方（文化庁）に基づき、常用漢字、現代仮名遣い、送り仮名などをリアルタイムでチェックします。
                    <br />
                    APIサーバー: <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:8080</code>
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px] p-6">
                <TextLintProvider apiEndpoint="http://localhost:8080">
                    <TextLintEditor initialText="これはテストです。コンピュータを使う。冨士山。" />
                </TextLintProvider>
            </div>
        </div>
    );
}
