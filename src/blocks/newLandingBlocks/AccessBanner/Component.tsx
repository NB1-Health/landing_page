'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import React, { useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter, usePathname } from 'next/navigation'

import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { fields } from '@/blocks/Form/fields'
import { getDictionary } from '@/i18n/getDictionary'
import { trackLeadSuccess } from '@/lib/dataLayer'

export type AccessBannerBlockType = {
  blockName?: string
  blockType?: 'accessBanner'
  title: DefaultTypedEditorState
  subtitle?: string
  quote?: string
  formText?: string
  buttonText?: string
  form: FormType
}

type Props = {
  id?: string
} & AccessBannerBlockType

export const AccessBannerComponent: React.FC<Props> = (props) => {
  const { title, subtitle, quote, formText, buttonText, form: formFromProps } = props

  const { id: formID, confirmationType, redirect, submitButtonLabel } = (formFromProps ?? {}) as any

  const formMethods = useForm({
    defaultValues: (formFromProps as any)?.fields || {},
  })

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()

  const router = useRouter()
  const pathname = usePathname()
  const dict = getDictionary(pathname?.split('/')?.[1] === 'de' ? 'de' : 'en')

  const onSubmit = useCallback(
    (data: Record<string, unknown>) => {
      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        setIsLoading(true)

        try {
          const req = await fetch(`/cms/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          })

          const res = await req.json()

          if (req.status >= 400) {
            setIsLoading(false)
            setError({
              message: res?.errors?.[0]?.message || 'Internal Server Error',
              status: String(res?.status || req.status),
            })
            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          trackLeadSuccess({
            leadType: 'form_submission',
            leadSource: 'access_banner',
            formId: String(formID),
            provider: 'payload_cms',
            providerSubmissionId: String(res?.doc?.id ?? res?.id ?? ''),
            pageLanguage: document.documentElement.lang || undefined,
          })

          if (confirmationType === 'redirect' && redirect?.url) {
            router.push(redirect.url)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({ message: 'Something went wrong.' })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType],
  )

  const submitLabel = useMemo(() => {
    return buttonText || submitButtonLabel || 'Submit'
  }, [buttonText, submitButtonLabel])

  return (
    <section className="my-12 mx-[1rem] lg:mx-[40px] overflow-hidden rounded-[20px] bg-[#222E3E] p-[2rem] lg:px-[64px] lg:py-[95px]">
      <div className="grid items-center gap-[60px] lg:gap-12 lg:grid-cols-2">
        {/* Left: title + subtitle */}
        <div>
          <div className="[&_h1]:m-0 [&_h1]:font-['Instrument_Sans'] [&_h1]:text-[40px] [&_h1]:font-medium [&_h1]:leading-[48px] [&_h1]:tracking-[-0.03em] [&_h2]:m-0 [&_h2]:font-['Instrument_Sans'] [&_h2]:text-[40px] [&_h2]:font-medium [&_h2]:leading-[48px] [&_h2]:tracking-[-0.03em] [&_h3]:m-0 [&_h3]:font-['Instrument_Sans'] [&_h3]:text-[40px] [&_h3]:font-medium [&_h3]:leading-[48px] [&_h3]:tracking-[-0.03em] [&_p]:m-0 [&_p]:font-['Instrument_Sans'] [&_p]:text-[40px] [&_p]:font-medium [&_p]:leading-[48px] [&_p]:tracking-[-0.03em] lg:[&_h1]:text-[64px] lg:[&_h1]:leading-[74px] lg:[&_h2]:text-[64px] lg:[&_h2]:leading-[74px] lg:[&_h3]:text-[64px] lg:[&_h3]:leading-[74px] lg:[&_p]:text-[64px] lg:[&_p]:leading-[74px] text-white">
            <RichText data={title as any} enableGutter={false} enableProse={false} />
          </div>

          {subtitle ? (
            <p className="mt-4 font-['Inter'] text-[18px] font-normal leading-[26px] tracking-[-0.03em] text-[#D9D9D9] lg:text-[24px] lg:leading-[34px]">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Right: quote + form */}
        <div>
          {quote ? (
            <p className="mb-[60px] lg:mb-[14px] text-center font-['Inter'] text-[24px] font-normal leading-[34px] tracking-[-0.03em] text-[#D9D9D9] lg:text-left">
              &ldquo;{quote}&rdquo;
            </p>
          ) : null}

          {formText ? (
            <p className="mb-[16px] text-center font-['Inter'] text-[16px] font-normal leading-[1] tracking-[-0.03em] text-[#D9D9D9] lg:text-left">
              {formText}
            </p>
          ) : null}

          <FormProvider {...formMethods}>
            {!isLoading && hasSubmitted && (
              <div className="text-white">
                <p>{dict.forms.thankYouRegistering}</p>
              </div>
            )}

            {isLoading && !hasSubmitted && <p className="mb-3 text-white/70">Please wait...</p>}

            {error && (
              <div className="mb-4 text-sm text-red-400">
                {`${error.status || '500'}: ${error.message || ''}`}
              </div>
            )}

            {!hasSubmitted && (
              <form id={`access-banner-${String(formID)}`} onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                  <div className="flex-1 space-y-4 [&_input]:border [&_input]:border-[#717171] [&_input]:!bg-transparent [&_input]:text-[#D9D9D9] [&_input]:placeholder:text-[#D9D9D9]">
                    {(formFromProps as any)?.fields?.map((field: any, index: number) => {
                      const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]

                      if (!Field) return null

                      return (
                        <div key={index}>
                          <Field
                            form={formFromProps}
                            {...field}
                            {...formMethods}
                            control={control}
                            errors={errors}
                            register={register}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <Button
                    form={`access-banner-${String(formID)}`}
                    type="submit"
                    variant="default"
                    className="h-[60px] w-full rounded-full bg-[#008498] px-6 text-center text-white hover:bg-[#006f80] font-['Instrument_Sans'] text-[20px] font-medium leading-[30px] tracking-[0] lg:w-fit lg:shrink-0"
                  >
                    {submitLabel}
                  </Button>
                </div>
              </form>
            )}
          </FormProvider>
        </div>
      </div>
    </section>
  )
}
