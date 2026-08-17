'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import React, { useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import RichText from '@/components/RichText'
import { Button } from '@/components/ui/button'
import type { Media } from '@/payload-types'
import { fields } from '@/blocks/Form/fields'
import { CarouselBanner } from '@/blocks/WelcomeBanner/CarouselBanner'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { getDictionary } from '@/i18n/getDictionary'
import type { AppLocale } from '@/i18n/config'

export type ProductBannerBlockType = {
  blockName?: string
  blockType?: 'productBanner'
  title: DefaultTypedEditorState
  subtitle?: string
  formText?: string
  buttonText?: string
  form: FormType
  enableIntro?: boolean
  introContent?: DefaultTypedEditorState
  carouselText?: {
    id?: string
    label: string
  }[]
  bannerImage?: number | Media
  bannerBackground?: number | Media
  mobileBannerBackground?: number | Media
  logo?: number | Media
  loginButton?: {
    show?: boolean
    label?: string
    url?: string
  }
}

type Props = {
  id?: string
  locale: AppLocale
  pageSlugs?: Partial<Record<AppLocale, string>> | null
} & ProductBannerBlockType

function isMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null
}

export const ProductBannerComponent: React.FC<Props> = (props) => {
  const {
    title,
    subtitle,
    formText,
    buttonText,
    enableIntro,
    introContent,
    carouselText,
    bannerImage,
    bannerBackground,
    mobileBannerBackground,
    logo,
    loginButton,
    form: formFromProps,
    locale,
    pageSlugs,
  } = props

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
  const isGerman = pathname?.split('/')?.[1] === 'de'
  const dict = getDictionary(isGerman ? 'de' : 'en')

  const bgMedia = isMedia(bannerBackground) ? bannerBackground : null
  const mobileBgMedia = isMedia(mobileBannerBackground) ? mobileBannerBackground : null
  const imageMedia = isMedia(bannerImage) ? bannerImage : null
  const logoMedia = isMedia(logo) ? logo : null

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

  const imageCarousel = (
    <div className="relative">
      {carouselText?.length ? (
        <div
          className={`absolute inset-0 z-0 ${isGerman ? 'translate-x-[-20px] translate-y-[120px] lg:translate-x-[-35px] lg:translate-y-[190px]' : 'translate-x-[20px] translate-y-[120px] lg:translate-x-[110px] lg:translate-y-[155px]'}`}
        >
          <CarouselBanner
            bannerLabels={carouselText.map((item) => ({
              id: item.id,
              textLabel: item.label,
            }))}
          />
        </div>
      ) : null}
      {imageMedia?.url ? (
        <div className="relative z-10 overflow-hidden rounded-[28px]">
          <div className="relative aspect-[4/3] w-full">
            <Image src={imageMedia.url} alt={imageMedia.alt || ''} fill className="object-cover" />
          </div>
        </div>
      ) : null}
    </div>
  )

  return (
    <section className="relative mb-[3rem] mx-[1rem] lg:mx-[40px] overflow-hidden rounded-[20px] mt-[36px]">
      {mobileBgMedia?.url ? (
        <div className="absolute inset-0 md:hidden">
          <Image
            src={mobileBgMedia.url}
            alt={mobileBgMedia.alt || ''}
            fill
            priority={false}
            className="object-cover"
          />
        </div>
      ) : null}
      {bgMedia?.url ? (
        <div className={`absolute inset-0 ${mobileBgMedia?.url ? 'hidden md:block' : ''}`}>
          <Image
            src={bgMedia.url}
            alt={bgMedia.alt || ''}
            fill
            priority={false}
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="absolute inset-0 bg-black/10" />

      <div className="relative container p-[2rem] pt-[2rem] md:pt-[36px] md:pb-12 md:pl-[84px]">
        {/* Top bar: logo + login button */}
        <div className="flex items-center justify-between">
          {logoMedia?.url ? (
            <div className="relative h-[32px] md:h-[40px]" style={{ width: 'fit-content' }}>
              <Image
                src={logoMedia.url}
                alt={logoMedia.alt || 'Logo'}
                height={100}
                width={100}
                className="object-contain"
              />
            </div>
          ) : null}
          <div className="flex items-center" style={{ gap: '24px' }}>
            <LocaleSwitcher locale={locale} pageSlugs={pageSlugs} textColor="#393939" />
            {loginButton?.show && loginButton?.label && loginButton?.url ? (
              <Link href={loginButton.url}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-[50px] w-[120px] rounded-full border border-[#009FB7] bg-transparent px-[30px] text-[#393939] hover:bg-[#009FB7] hover:text-white"
                >
                  {loginButton.label}
                </Button>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-white">
            <div className="max-w-[640px] mt-[80px]">
              <div className="[&_h1]:m-0 [&_h1]:text-[36px] [&_h1]:font-medium [&_h1]:leading-[42px] [&_h1]:tracking-[-0.02em] [&_h2]:m-0 [&_h2]:text-[36px] [&_h2]:font-medium [&_h2]:leading-[42px] [&_h2]:tracking-[-0.02em] [&_h3]:m-0 [&_h3]:text-[36px] [&_h3]:font-medium [&_h3]:leading-[42px] [&_h3]:tracking-[-0.02em] [&_p]:m-0 [&_p]:text-[36px] [&_p]:font-medium [&_p]:leading-[42px] [&_p]:tracking-[-0.02em] md:[&_h1]:text-[56px] md:[&_h1]:leading-[62px] md:[&_h2]:text-[56px] md:[&_h2]:leading-[62px] md:[&_h3]:text-[56px] md:[&_h3]:leading-[62px] md:[&_p]:text-[56px] md:[&_p]:leading-[62px]">
                <RichText data={title as any} enableGutter={false} enableProse={false} />
              </div>

              {subtitle ? (
                <p className="mt-4 max-w-[560px] font-['Inter'] text-[15px] font-normal leading-[24px] tracking-[-0.03em] text-[#292929] md:text-[24px] md:leading-[34px]">
                  {subtitle}
                </p>
              ) : null}

              {enableIntro && introContent ? (
                <div className="mt-6 max-w-[560px] text-white/90 [&_*]:text-white">
                  <RichText data={introContent as any} enableGutter={false} />
                </div>
              ) : null}

              {/* Image + carousel: mobile only */}
              <div
                className="mt-8 h-[310px] lg:hidden"
                style={{ clipPath: 'inset(0 -9999px 0 -9999px)' }}
              >
                <div className="-translate-x-[40px] transform">{imageCarousel}</div>
              </div>

              <div className="mt-[60px] p-0">
                {formText ? (
                  <p className="mb-[12px] font-['Inter'] text-[16px] font-normal leading-[1] tracking-[-0.03em] text-[#303438]">
                    {formText}
                  </p>
                ) : null}

                <FormProvider {...formMethods}>
                  {!isLoading && hasSubmitted && (
                    <div className="text-[#111111]">
                      <p>{dict.forms.thankYouRegistering}</p>
                    </div>
                  )}

                  {isLoading && !hasSubmitted && (
                    <p className="mb-3 text-[#111111]">Please wait...</p>
                  )}

                  {error && (
                    <div className="mb-4 text-sm text-red-600">
                      {`${error.status || '500'}: ${error.message || ''}`}
                    </div>
                  )}

                  {!hasSubmitted && (
                    <form id={`product-banner-${String(formID)}`} onSubmit={handleSubmit(onSubmit)}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                        <div className="flex-1 space-y-4 [&_input]:text-black [&_input]:placeholder:text-black [&_label]:text-black">
                          {(formFromProps as any)?.fields?.map((field: any, index: number) => {
                            const Field: React.FC<any> =
                              fields?.[field.blockType as keyof typeof fields]

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
                          form={`product-banner-${String(formID)}`}
                          type="submit"
                          variant="default"
                          className="h-[60px] w-full rounded-full bg-black px-6 text-center text-white hover:bg-black/80 font-['Instrument_Sans'] text-[20px] font-medium leading-[30px] tracking-[0] lg:w-fit lg:shrink-0"
                        >
                          {submitLabel}
                        </Button>
                      </div>
                    </form>
                  )}
                </FormProvider>
              </div>
            </div>
          </div>

          {/* Image + carousel: desktop only */}
          <div className="relative hidden lg:block">
            <div className="scale-[1] -translate-x-8 transform">{imageCarousel}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
