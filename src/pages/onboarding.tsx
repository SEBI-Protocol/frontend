'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClipboardIcon, CheckIcon, Loader2 } from 'lucide-react'
import axios from 'axios'
// Custom Steps component
const Steps = ({ currentStep, children }: { currentStep: number; children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 right-0 top-4 border-t border-gray-300" aria-hidden="true"></div>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { isActive: index === currentStep, isCompleted: index < currentStep })
        }
        return child
      })}
    </div>
  )
}

const Step = ({ title, isActive, isCompleted }: { title: string; isActive?: boolean; isCompleted?: boolean }) => {
  return (
    <div className={`flex flex-col items-center relative z-10 ${isActive ? 'text-primary' : isCompleted ? 'text-muted-foreground' : 'text-muted'}`}>
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 bg-background ${isActive ? 'border-primary' : isCompleted ? 'border-muted-foreground' : 'border-muted'}`}>
        {isCompleted ? '✓' : (isActive ? '•' : '')}
      </div>
      <span className="text-sm">{title}</span>
    </div>
  )
}

// Simulated Dynamic wallet integration
const createWallet = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500))
  return { address: '0x' + Math.random().toString(16).substr(2, 40) }
}

// Simulated token launch process
const launchToken = async () => {
  // await new Promise(resolve => setTimeout(resolve, 3000))
  await axios('/api/launch')
  return { success: true }
}

export default function EquityTokenOnboarding() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    tokenSymbol: '',
    tokenSupply: '',
    liquidityPoolTokens: '',
    initialLiquidity: '',
    walletAddress: ''
  })
  const [copied, setCopied] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [isLaunchComplete, setIsLaunchComplete] = useState(false)
  const [isNextDisabled, setIsNextDisabled] = useState(true)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleCreateWallet = async () => {
    const wallet = await createWallet()
    setFormData({ ...formData, walletAddress: wallet.address })
    handleNext()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLaunching(true)
    const result = await launchToken()
    setIsLaunching(false)
    if (result.success) {
      setIsLaunchComplete(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const checkFields = () => {
      switch (step) {
        case 0:
          setIsNextDisabled(!formData.businessName || !formData.description)
          break
        case 1:
          setIsNextDisabled(!formData.tokenSymbol || !formData.tokenSupply || !formData.liquidityPoolTokens || !formData.initialLiquidity)
          break
        case 2:
          setIsNextDisabled(!formData.walletAddress)
          break
        default:
          setIsNextDisabled(false)
      }
    }
    checkFields()
  }, [step, formData])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <img src="sebi.png" width={100} />
        </div>
      </header>
      <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Launch Your Equity Token</CardTitle>
            <CardDescription>Complete the following steps to set up your token on SEBI Protocol</CardDescription>
          </CardHeader>
          <CardContent>
            <Steps currentStep={step}>
              <Step title="Business Info" />
              <Step title="Token Details" />
              <Step title="Create Wallet" />
              <Step title="Review" />
            </Steps>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tokenSymbol">Token Symbol (3 letters)</Label>
                    <Input
                      id="tokenSymbol"
                      name="tokenSymbol"
                      value={formData.tokenSymbol}
                      onChange={handleInputChange}
                      maxLength={3}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tokenSupply">Total Token Supply</Label>
                    <Input
                      id="tokenSupply"
                      name="tokenSupply"
                      type="number"
                      value={formData.tokenSupply}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="liquidityPoolTokens">Tokens for Liquidity Pool</Label>
                    <Input
                      id="liquidityPoolTokens"
                      name="liquidityPoolTokens"
                      type="number"
                      value={formData.liquidityPoolTokens}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the amount of tokens to be used for creating the liquidity pool.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialLiquidity">Initial Liquidity (in ETH)</Label>
                    <Input
                      id="initialLiquidity"
                      name="initialLiquidity"
                      type="number"
                      step="0.01"
                      value={formData.initialLiquidity}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-lg">Create a wallet to manage your tokens:</p>
                  <Button type="button" onClick={handleCreateWallet} className="w-full">
                    Create Wallet with Dynamic
                  </Button>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Review Your Information</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">Token Details</TableHead>
                        <TableHead className="w-2/3">Provided Information</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Business Name</TableCell>
                        <TableCell>{formData.businessName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Description</TableCell>
                        <TableCell>{formData.description}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Token Symbol</TableCell>
                        <TableCell>{formData.tokenSymbol}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Token Supply</TableCell>
                        <TableCell>{formData.tokenSupply}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Tokens for Liquidity Pool</TableCell>
                        <TableCell>{formData.liquidityPoolTokens}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Initial Liquidity</TableCell>
                        <TableCell>{formData.initialLiquidity} ETH</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Wallet Address</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 truncate">{formData.walletAddress}</div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={copyToClipboard}
                              className="flex-shrink-0"
                            >
                              {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Please send {formData.initialLiquidity} ETH to the wallet address above for gas fees and initial liquidity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 0 && (
              <Button onClick={handlePrevious} variant="outline">
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} disabled={isNextDisabled}>
                Next
              </Button>
            ) : (
              <Button type="submit" onClick={handleSubmit} disabled={isLaunching || isLaunchComplete}>
                {isLaunching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Launching...
                  </>
                ) : isLaunchComplete ? (
                  'Token Launched!'
                ) : (
                  'Launch Token'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
      <AnimatePresence>
        {isLaunchComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <h2 className="text-black text-2xl font-bold mb-4">Congratulations!</h2>
              <p className='text-green-800'>Your equity token has been successfully launched.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}