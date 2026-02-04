'use client'

import { useState } from 'react'
import { Share2, Facebook, Twitter, MessageCircle, Link as LinkIcon, Copy, Check } from 'lucide-react'

interface SocialShareProps {
  url: string
  title: string
  description?: string
  className?: string
}

export default function SocialShare({
  url,
  title,
  description = '',
  className = '',
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url
  const shareText = `${title}${description ? ` - ${description}` : ''}`

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const shareToWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      '_blank'
    )
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Failed to copy
    }
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy
      copyLink()
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
        <button
          onClick={nativeShare}
          className="p-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={shareToFacebook}
        className="p-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors"
        title="Share on Facebook"
      >
        <Facebook className="w-5 h-5" />
      </button>
      <button
        onClick={shareToTwitter}
        className="p-2 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1a8cd8] transition-colors"
        title="Share on Twitter"
      >
        <Twitter className="w-5 h-5" />
      </button>
      <button
        onClick={shareToWhatsApp}
        className="p-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
      <button
        onClick={copyLink}
        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        title="Copy link"
      >
        {copied ? (
          <Check className="w-5 h-5" />
        ) : (
          <LinkIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}
